export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'

export interface GeminiService {
  organize(rawText: string, apiKey: string, model?: string): Promise<string>
}

const ORGANIZE_PROMPT = `あなたは日誌の清書係です。以下はユーザーが音声入力で話した今日の記録です。
次のルールで読みやすく整えてください。

- 内容の追加・推測・助言はしない。話された事実だけを使う
- 「えーと」「なんか」等のフィラーや重複を除去し、自然な文章に直す
- 事実・数字・固有名詞・感情の表現は落とさない
- 話題の区切りで段落を分ける。見出しや箇条書きは使わない
- 全体の長さは原文の3〜7割程度
- 出力は整えた本文のみ。前置きや説明は書かない

【原文】
{{RAW_TEXT}}`

export class GeminiApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'GeminiApiError'
    this.status = status
  }
}

export class HttpGeminiService implements GeminiService {
  async organize(
    rawText: string,
    apiKey: string,
    model: string = DEFAULT_GEMINI_MODEL,
  ): Promise<string> {
    const prompt = ORGANIZE_PROMPT.replace('{{RAW_TEXT}}', rawText)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })

    if (!response.ok) {
      throw new GeminiApiError(
        `Gemini API がエラーを返しました(status ${response.status})`,
        response.status,
      )
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof text !== 'string' || text.trim() === '') {
      throw new GeminiApiError('Gemini から整理結果を取得できませんでした')
    }
    return text.trim()
  }
}

export class MockGeminiService implements GeminiService {
  async organize(rawText: string): Promise<string> {
    return `(モック整理) ${rawText.trim()}`
  }
}
