import { describe, expect, it } from 'vitest'
import { base64ToUtf8, utf8ToBase64 } from './base64'

describe('utf8 base64 round trip', () => {
  it.each([
    '',
    'hello world',
    '今日は良い天気でした',
    '絵文字も大丈夫? 🎣🐟😀',
    '改行を\n含む\nテキスト',
    'GitHub の PAT は 401 で失効する',
  ])('round-trips %j', (text) => {
    expect(base64ToUtf8(utf8ToBase64(text))).toBe(text)
  })
})
