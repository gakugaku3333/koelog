export interface DayEntry {
  time: string
  organized: string
  raw: string
}

export interface DayFile {
  date: string
  entries: DayEntry[]
}

const TIME_HEADING = /^## (\d{2}:\d{2})\s*$/

export function serializeDayFile(day: DayFile): string {
  const sections = day.entries.map((entry) => serializeEntry(entry))
  return `# ${day.date}\n\n${sections.join('\n')}`
}

function serializeEntry(entry: DayEntry): string {
  return (
    `## ${entry.time}\n\n` +
    `${entry.organized}\n\n` +
    `<details><summary>原文</summary>\n\n` +
    `${entry.raw}\n\n` +
    `</details>\n\n`
  )
}

export function appendEntry(day: DayFile, entry: DayEntry): DayFile {
  return { ...day, entries: [...day.entries, entry] }
}

export function parseDayFile(date: string, markdown: string): DayFile {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const entries: DayEntry[] = []

  let i = 0
  // 先頭の `# YYYY-MM-DD` 見出しを読み飛ばす
  while (i < lines.length && !TIME_HEADING.test(lines[i])) {
    i++
  }

  while (i < lines.length) {
    const heading = TIME_HEADING.exec(lines[i])
    if (!heading) {
      i++
      continue
    }
    const time = heading[1]
    i++

    const bodyLines: string[] = []
    while (i < lines.length && !TIME_HEADING.test(lines[i])) {
      bodyLines.push(lines[i])
      i++
    }

    entries.push(parseEntryBody(time, bodyLines.join('\n')))
  }

  return { date, entries }
}

function parseEntryBody(time: string, body: string): DayEntry {
  const detailsStart = body.indexOf('<details>')
  const detailsEnd = body.indexOf('</details>')

  if (detailsStart === -1 || detailsEnd === -1) {
    return { time, organized: body.trim(), raw: '' }
  }

  const organized = body.slice(0, detailsStart).trim()
  const detailsBlock = body.slice(detailsStart, detailsEnd)
  const summaryEnd = detailsBlock.indexOf('</summary>')
  const raw =
    summaryEnd === -1
      ? ''
      : detailsBlock.slice(summaryEnd + '</summary>'.length).trim()

  return { time, organized, raw }
}
