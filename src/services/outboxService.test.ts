import { beforeEach, describe, expect, it } from 'vitest'
import { parseDayFile } from '../lib/markdownCodec'
import { db } from '../db/schema'
import { entryPathForDate } from './entryPath'
import { MockGithubService } from './githubService'
import { enqueue, flushOutbox, pendingCount } from './outboxService'

const config = { owner: 'gakugaku3333', repo: 'koelog-data', token: 'test-token' }

beforeEach(async () => {
  await db.outbox.clear()
})

describe('outboxService', () => {
  it('flushes a queued saveEntry action and clears the queue', async () => {
    const github = new MockGithubService()
    await enqueue({ kind: 'saveEntry', date: '2026-07-08', time: '21:45', organized: 'A', raw: 'a' })

    expect(await pendingCount()).toBe(1)
    await flushOutbox(github, config)
    expect(await pendingCount()).toBe(0)

    const file = await github.getFile(config, entryPathForDate('2026-07-08'))
    const day = parseDayFile('2026-07-08', file!.content)
    expect(day.entries).toEqual([{ time: '21:45', organized: 'A', raw: 'a' }])
  })

  it('flushes multiple queued actions in order', async () => {
    const github = new MockGithubService()
    await enqueue({ kind: 'saveEntry', date: '2026-07-08', time: '08:00', organized: 'A', raw: 'a' })
    await enqueue({ kind: 'saveEntry', date: '2026-07-08', time: '21:45', organized: 'B', raw: 'b' })

    await flushOutbox(github, config)

    const file = await github.getFile(config, entryPathForDate('2026-07-08'))
    const day = parseDayFile('2026-07-08', file!.content)
    expect(day.entries.map((e) => e.time)).toEqual(['08:00', '21:45'])
  })

  it('keeps a failing action in the queue with an incremented attempt count', async () => {
    const github = new MockGithubService()
    await enqueue({ kind: 'saveEntry', date: '2026-07-08', time: '21:45', organized: 'A', raw: 'a' })

    const broken = {
      ...github,
      getFile: async () => {
        throw new Error('network down')
      },
    }

    await flushOutbox(broken as unknown as MockGithubService, config)

    expect(await pendingCount()).toBe(1)
    const [record] = await db.outbox.toArray()
    expect(record.attempts).toBe(1)
    expect(record.lastError).toContain('network down')
  })
})
