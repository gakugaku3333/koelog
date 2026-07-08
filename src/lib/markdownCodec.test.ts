import { describe, expect, it } from 'vitest'
import {
  appendEntry,
  type DayEntry,
  type DayFile,
  parseDayFile,
  serializeDayFile,
} from './markdownCodec'

function roundTrip(day: DayFile): DayFile {
  return parseDayFile(day.date, serializeDayFile(day))
}

describe('markdownCodec', () => {
  it('round-trips a day with 0 entries', () => {
    const day: DayFile = { date: '2026-07-08', entries: [] }
    expect(roundTrip(day)).toEqual(day)
  })

  it('round-trips a day with 1 entry', () => {
    const day: DayFile = {
      date: '2026-07-08',
      entries: [
        { time: '21:45', organized: '今日は良い一日だった。', raw: 'えーと今日はいい感じだった' },
      ],
    }
    expect(roundTrip(day)).toEqual(day)
  })

  it('round-trips a day with multiple entries', () => {
    const day: DayFile = {
      date: '2026-07-08',
      entries: [
        { time: '08:10', organized: '朝の記録その1', raw: '朝話した内容' },
        { time: '21:45', organized: '夜の記録その2', raw: '夜話した内容' },
      ],
    }
    expect(roundTrip(day)).toEqual(day)
  })

  it('round-trips an entry whose raw text contains markdown-like symbols', () => {
    const entry: DayEntry = {
      time: '12:00',
      organized: '## 見出しっぽい文字列や `コード` を含む整理版',
      raw: '原文にも # や ** や <details> という文字列そのものが入る場合',
    }
    const day: DayFile = { date: '2026-07-08', entries: [entry] }
    expect(roundTrip(day)).toEqual(day)
  })

  it('appendEntry adds to the same day file without mutating the original', () => {
    const day: DayFile = {
      date: '2026-07-08',
      entries: [{ time: '08:00', organized: 'A', raw: 'a' }],
    }
    const appended = appendEntry(day, { time: '20:00', organized: 'B', raw: 'b' })

    expect(day.entries).toHaveLength(1)
    expect(appended.entries).toHaveLength(2)
    expect(roundTrip(appended)).toEqual(appended)
  })

  it('produces markdown that reads correctly on GitHub (heading + details)', () => {
    const day: DayFile = {
      date: '2026-07-08',
      entries: [{ time: '21:45', organized: '整理版本文', raw: '原文本文' }],
    }
    const markdown = serializeDayFile(day)
    expect(markdown).toContain('# 2026-07-08')
    expect(markdown).toContain('## 21:45')
    expect(markdown).toContain('<details><summary>原文</summary>')
    expect(markdown).toContain('原文本文')
  })
})
