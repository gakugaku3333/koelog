import { describe, expect, it } from 'vitest'
import { parseDayFile } from '../lib/markdownCodec'
import { deleteEntry, saveEntry } from './entryService'
import { entryPathForDate } from './entryPath'
import { MockGithubService } from './githubService'
import { parseIndexFile } from './indexFile'

const config = { owner: 'gakugaku3333', repo: 'koelog-data', token: 'test-token' }

describe('entryService', () => {
  it('saves a first entry and creates index.json', async () => {
    const github = new MockGithubService()

    await saveEntry(github, config, {
      date: '2026-07-08',
      time: '21:45',
      organized: '整理版のテキスト',
      raw: '原文のテキスト',
    })

    const file = await github.getFile(config, entryPathForDate('2026-07-08'))
    expect(file).not.toBeNull()
    const day = parseDayFile('2026-07-08', file!.content)
    expect(day.entries).toEqual([
      { time: '21:45', organized: '整理版のテキスト', raw: '原文のテキスト' },
    ])

    const indexFile = await github.getFile(config, 'index.json')
    const index = parseIndexFile(indexFile!.content)
    expect(index.days).toEqual([
      expect.objectContaining({ date: '2026-07-08', count: 1, path: entryPathForDate('2026-07-08') }),
    ])
  })

  it('appends a second entry on the same day and increments count', async () => {
    const github = new MockGithubService()
    await saveEntry(github, config, { date: '2026-07-08', time: '08:00', organized: '朝', raw: '朝原文' })
    await saveEntry(github, config, { date: '2026-07-08', time: '21:45', organized: '夜', raw: '夜原文' })

    const file = await github.getFile(config, entryPathForDate('2026-07-08'))
    const day = parseDayFile('2026-07-08', file!.content)
    expect(day.entries).toHaveLength(2)

    const indexFile = await github.getFile(config, 'index.json')
    const index = parseIndexFile(indexFile!.content)
    expect(index.days).toHaveLength(1)
    expect(index.days[0].count).toBe(2)
  })

  it('deleteEntry removes the entry and updates count, removing the day when empty', async () => {
    const github = new MockGithubService()
    await saveEntry(github, config, { date: '2026-07-08', time: '08:00', organized: 'A', raw: 'a' })
    await saveEntry(github, config, { date: '2026-07-08', time: '21:45', organized: 'B', raw: 'b' })

    await deleteEntry(github, config, '2026-07-08', '08:00')

    const file = await github.getFile(config, entryPathForDate('2026-07-08'))
    const day = parseDayFile('2026-07-08', file!.content)
    expect(day.entries).toEqual([{ time: '21:45', organized: 'B', raw: 'b' }])

    let indexFile = await github.getFile(config, 'index.json')
    let index = parseIndexFile(indexFile!.content)
    expect(index.days[0].count).toBe(1)

    await deleteEntry(github, config, '2026-07-08', '21:45')
    indexFile = await github.getFile(config, 'index.json')
    index = parseIndexFile(indexFile!.content)
    expect(index.days).toEqual([])
  })
})
