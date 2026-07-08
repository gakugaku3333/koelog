export function entryPathForDate(date: string): string {
  const [year, month] = date.split('-')
  return `entries/${year}/${month}/${date}.md`
}
