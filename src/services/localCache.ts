import { db, type EntryRecord } from '../db/schema'

function keyOf(date: string, time: string): string {
  return `${date}#${time}`
}

export async function upsertLocalEntry(entry: {
  date: string
  time: string
  organized: string
  raw: string
}): Promise<void> {
  const record: EntryRecord = {
    key: keyOf(entry.date, entry.time),
    date: entry.date,
    time: entry.time,
    organized: entry.organized,
    raw: entry.raw,
    updatedAt: new Date().toISOString(),
  }
  await db.entriesCache.put(record)
}

export async function removeLocalEntry(date: string, time: string): Promise<void> {
  await db.entriesCache.delete(keyOf(date, time))
}

export async function countEntriesForDate(date: string): Promise<number> {
  return db.entriesCache.where('date').equals(date).count()
}

export async function listEntriesForDate(date: string): Promise<EntryRecord[]> {
  const entries = await db.entriesCache.where('date').equals(date).toArray()
  return entries.sort((a, b) => a.time.localeCompare(b.time))
}

export async function listAllEntriesNewestFirst(): Promise<EntryRecord[]> {
  const entries = await db.entriesCache.toArray()
  return entries.sort((a, b) => `${b.date}#${b.time}`.localeCompare(`${a.date}#${a.time}`))
}
