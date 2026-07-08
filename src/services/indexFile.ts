export interface IndexDay {
  date: string
  path: string
  count: number
  preview: string
  updatedAt: string
}

export interface IndexFile {
  version: 1
  days: IndexDay[]
}

export const EMPTY_INDEX: IndexFile = { version: 1, days: [] }

export function parseIndexFile(json: string): IndexFile {
  const parsed = JSON.parse(json) as IndexFile
  if (parsed.version !== 1 || !Array.isArray(parsed.days)) {
    throw new Error('index.json の形式が不正です')
  }
  return parsed
}

export function serializeIndexFile(index: IndexFile): string {
  return JSON.stringify(index, null, 2)
}

export function upsertIndexDay(index: IndexFile, day: IndexDay): IndexFile {
  const others = index.days.filter((d) => d.date !== day.date)
  const days = [...others, day].sort((a, b) => b.date.localeCompare(a.date))
  return { version: 1, days }
}

export function removeIndexDay(index: IndexFile, date: string): IndexFile {
  return { version: 1, days: index.days.filter((d) => d.date !== date) }
}

export function previewOf(text: string, length = 80): string {
  const singleLine = text.replace(/\s+/g, ' ').trim()
  return singleLine.length > length ? `${singleLine.slice(0, length)}…` : singleLine
}
