import { describe, expect, it } from 'vitest'
import { formatDate, formatTime } from './dateFormat'

describe('dateFormat', () => {
  it('formats date as YYYY-MM-DD with zero padding', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(formatDate(new Date(2026, 11, 25))).toBe('2026-12-25')
  })

  it('formats time as HH:MM with zero padding', () => {
    expect(formatTime(new Date(2026, 0, 5, 8, 5))).toBe('08:05')
    expect(formatTime(new Date(2026, 0, 5, 23, 59))).toBe('23:59')
  })
})
