import Dexie, { type EntityTable } from 'dexie'

export interface DraftRecord {
  id: 'current'
  text: string
  updatedAt: string
}

export type OutboxAction =
  | { kind: 'saveEntry'; date: string; time: string; organized: string; raw: string }
  | { kind: 'updateEntry'; date: string; time: string; organized: string; raw: string }
  | { kind: 'deleteEntry'; date: string; time: string }

export interface OutboxRecord {
  id?: number
  createdAt: string
  attempts: number
  lastError?: string
  action: OutboxAction
}

export interface EntryRecord {
  /** `${date}#${time}` (例: 2026-07-08#21:45) */
  key: string
  date: string
  time: string
  organized: string
  raw: string
  updatedAt: string
}

export type GeminiModel = string

export interface SettingsRecord {
  id: 'app'
  geminiApiKey?: string
  geminiModel?: GeminiModel
  githubOwner?: string
  githubRepo?: string
  githubToken?: string
}

export const db = new Dexie('koelog') as Dexie & {
  drafts: EntityTable<DraftRecord, 'id'>
  outbox: EntityTable<OutboxRecord, 'id'>
  entriesCache: EntityTable<EntryRecord, 'key'>
  settings: EntityTable<SettingsRecord, 'id'>
}

db.version(1).stores({
  drafts: 'id',
  outbox: '++id, createdAt',
  entriesCache: 'key, date',
  settings: 'id',
})
