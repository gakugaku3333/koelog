import { db, type SettingsRecord } from '../db/schema'
import { DEFAULT_GEMINI_MODEL } from './geminiService'
import type { GithubConfig } from './githubService'

export async function loadSettings(): Promise<SettingsRecord> {
  const existing = await db.settings.get('app')
  return existing ?? { id: 'app', geminiModel: DEFAULT_GEMINI_MODEL }
}

export async function saveSettings(settings: Omit<SettingsRecord, 'id'>): Promise<void> {
  await db.settings.put({ id: 'app', ...settings })
}

export function toGithubConfig(settings: SettingsRecord): GithubConfig | null {
  if (!settings.githubOwner || !settings.githubRepo || !settings.githubToken) return null
  return { owner: settings.githubOwner, repo: settings.githubRepo, token: settings.githubToken }
}
