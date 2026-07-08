import { appendEntry, parseDayFile, serializeDayFile, type DayFile } from '../lib/markdownCodec'
import { entryPathForDate } from './entryPath'
import type { GithubConfig, GithubService } from './githubService'
import {
  EMPTY_INDEX,
  parseIndexFile,
  previewOf,
  removeIndexDay,
  serializeIndexFile,
  upsertIndexDay,
  type IndexFile,
} from './indexFile'

const INDEX_PATH = 'index.json'
const MAX_RETRIES = 3

export interface SaveEntryInput {
  date: string
  time: string
  organized: string
  raw: string
}

async function withDayFileRetry(
  github: GithubService,
  config: GithubConfig,
  date: string,
  mutate: (day: DayFile) => DayFile,
  message: string,
): Promise<void> {
  const path = entryPathForDate(date)

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const existing = await github.getFile(config, path)
    const day = existing ? parseDayFile(date, existing.content) : { date, entries: [] }
    const mutated = mutate(day)
    const content = serializeDayFile(mutated)

    try {
      await github.putFile(config, path, content, message, existing?.sha)
      return
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) throw error
    }
  }
}

async function updateIndex(
  github: GithubService,
  config: GithubConfig,
  update: (index: IndexFile) => IndexFile,
): Promise<void> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const existing = await github.getFile(config, INDEX_PATH)
    const index = existing ? parseIndexFile(existing.content) : EMPTY_INDEX
    const updated = update(index)
    const content = serializeIndexFile(updated)

    try {
      await github.putFile(config, INDEX_PATH, content, 'index.json 更新', existing?.sha)
      return
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) throw error
    }
  }
}

export async function saveEntry(
  github: GithubService,
  config: GithubConfig,
  input: SaveEntryInput,
): Promise<void> {
  await withDayFileRetry(
    github,
    config,
    input.date,
    (day) => appendEntry(day, { time: input.time, organized: input.organized, raw: input.raw }),
    `${input.date} ${input.time} の記録を追加`,
  )

  await updateIndex(github, config, (index) =>
    upsertIndexDay(index, {
      date: input.date,
      path: entryPathForDate(input.date),
      count: countEntriesOnDate(index, input.date) + 1,
      preview: previewOf(input.organized),
      updatedAt: new Date().toISOString(),
    }),
  )
}

function countEntriesOnDate(index: IndexFile, date: string): number {
  return index.days.find((d) => d.date === date)?.count ?? 0
}

export async function deleteEntry(
  github: GithubService,
  config: GithubConfig,
  date: string,
  time: string,
): Promise<void> {
  let remaining = 0
  await withDayFileRetry(
    github,
    config,
    date,
    (day) => {
      const entries = day.entries.filter((e) => e.time !== time)
      remaining = entries.length
      return { ...day, entries }
    },
    `${date} ${time} の記録を削除`,
  )

  await updateIndex(github, config, (index) =>
    remaining === 0
      ? removeIndexDay(index, date)
      : upsertIndexDay(index, {
          date,
          path: entryPathForDate(date),
          count: remaining,
          preview: previewOf(index.days.find((d) => d.date === date)?.preview ?? ''),
          updatedAt: new Date().toISOString(),
        }),
  )
}
