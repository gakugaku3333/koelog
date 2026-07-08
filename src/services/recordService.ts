import { db } from '../db/schema'
import { saveEntry } from './entryService'
import { HttpGithubService, type GithubConfig } from './githubService'
import { upsertLocalEntry } from './localCache'
import { enqueue } from './outboxService'

export interface RecordInput {
  date: string
  time: string
  organized: string
  raw: string
}

export type RecordResult = { synced: true } | { synced: false; reason: string }

/**
 * ローカルキャッシュへ即時反映してから GitHub へ送信する。
 * 送信に失敗しても入力は失われず、outbox に積まれて後で自動再送される。
 */
export async function recordEntry(
  config: GithubConfig,
  input: RecordInput,
): Promise<RecordResult> {
  await upsertLocalEntry(input)
  await db.drafts.delete('current')

  try {
    await saveEntry(new HttpGithubService(), config, input)
    return { synced: true }
  } catch (error) {
    await enqueue({ kind: 'saveEntry', ...input })
    const reason = error instanceof Error ? error.message : String(error)
    return { synced: false, reason }
  }
}
