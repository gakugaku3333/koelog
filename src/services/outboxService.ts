import { db, type OutboxAction } from '../db/schema'
import { deleteEntry, saveEntry } from './entryService'
import { GithubApiError, type GithubConfig, type GithubService } from './githubService'

export async function enqueue(action: OutboxAction): Promise<void> {
  await db.outbox.add({ createdAt: new Date().toISOString(), attempts: 0, action })
}

export async function flushOutbox(github: GithubService, config: GithubConfig): Promise<void> {
  const pending = await db.outbox.orderBy('createdAt').toArray()

  for (const record of pending) {
    try {
      await applyAction(github, config, record.action)
      await db.outbox.delete(record.id!)
    } catch (error) {
      await db.outbox.update(record.id!, {
        attempts: record.attempts + 1,
        lastError: error instanceof Error ? error.message : String(error),
      })
      // 認証エラー(401)は以降のキューを送ってもすべて失敗するため打ち切る
      if (error instanceof GithubApiError && error.status === 401) {
        throw error
      }
    }
  }
}

async function applyAction(
  github: GithubService,
  config: GithubConfig,
  action: OutboxAction,
): Promise<void> {
  switch (action.kind) {
    case 'saveEntry':
      await saveEntry(github, config, {
        date: action.date,
        time: action.time,
        organized: action.organized,
        raw: action.raw,
      })
      return
    case 'deleteEntry':
      await deleteEntry(github, config, action.date, action.time)
      return
  }
}

export async function pendingCount(): Promise<number> {
  return db.outbox.count()
}
