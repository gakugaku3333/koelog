import { useEffect, useState } from 'react'
import { formatDate, formatTime } from '../lib/dateFormat'
import { GeminiApiError, HttpGeminiService } from '../services/geminiService'
import { recordEntry } from '../services/recordService'
import { loadSettings, toGithubConfig } from '../services/settingsService'

type Phase = 'organizing' | 'ready' | 'error' | 'saving' | 'saved'

export function ReviewScreen({
  rawText,
  onBackToInput,
  onSaved,
}: {
  rawText: string
  onBackToInput: () => void
  onSaved: () => void
}) {
  const [phase, setPhase] = useState<Phase>('organizing')
  const [organized, setOrganized] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showRaw, setShowRaw] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    void organize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function organize() {
    setPhase('organizing')
    setErrorMessage('')
    try {
      const settings = await loadSettings()
      if (!settings.geminiApiKey) throw new Error('Gemini API キーが未設定です')
      const service = new HttpGeminiService()
      const result = await service.organize(rawText, settings.geminiApiKey, settings.geminiModel)
      setOrganized(result)
      setPhase('ready')
    } catch (error) {
      setErrorMessage(
        error instanceof GeminiApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : '整理に失敗しました',
      )
      setPhase('error')
    }
  }

  async function save(textToSave: string) {
    setPhase('saving')
    const settings = await loadSettings()
    const config = toGithubConfig(settings)
    if (!config) {
      setErrorMessage('GitHub の設定が未完了です')
      setPhase('error')
      return
    }

    const now = new Date()
    const result = await recordEntry(config, {
      date: formatDate(now),
      time: formatTime(now),
      organized: textToSave,
      raw: rawText,
    })

    if (result.synced) {
      setSaveMessage('保存しました')
    } else {
      setSaveMessage(`保存しましたが送信できていません(自動で再送します): ${result.reason}`)
    }
    setPhase('saved')
    setTimeout(onSaved, 1200)
  }

  if (phase === 'organizing') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
        <p className="text-slate-300">整理しています…</p>
      </div>
    )
  }

  if (phase === 'saved') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-4 text-center">
        <p className="text-emerald-400 font-medium">{saveMessage}</p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col h-full p-4 gap-4">
        <p className="text-rose-400 text-sm">{errorMessage}</p>
        <p className="text-sm text-slate-400">
          整理に失敗しても、記録を原文のまま保存できます。
        </p>
        <div className="flex flex-col gap-2 mt-auto">
          <button
            type="button"
            onClick={() => void organize()}
            className="min-h-11 rounded-xl bg-slate-700 text-base font-medium"
          >
            もう一度整理
          </button>
          <button
            type="button"
            onClick={() => void save(rawText)}
            className="min-h-11 rounded-xl bg-sky-500 text-base font-semibold text-slate-900"
          >
            原文のまま保存
          </button>
          <button type="button" onClick={onBackToInput} className="min-h-11 text-sm text-slate-400">
            入力に戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <h1 className="text-lg font-semibold">整理結果</h1>
      <textarea
        value={organized}
        onChange={(e) => setOrganized(e.target.value)}
        className="flex-1 w-full rounded-xl bg-slate-800 p-4 text-base leading-relaxed resize-none outline-none focus:ring-2 focus:ring-sky-400"
      />
      <button
        type="button"
        onClick={() => setShowRaw((v) => !v)}
        className="text-left text-sm text-slate-400"
      >
        {showRaw ? '▲ 原文を隠す' : '▼ 原文を見る'}
      </button>
      {showRaw && (
        <p className="rounded-lg bg-slate-800/60 p-3 text-sm text-slate-400 whitespace-pre-wrap">
          {rawText}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={phase === 'saving'}
          onClick={() => void save(organized)}
          className="min-h-11 rounded-xl bg-sky-500 text-base font-semibold text-slate-900 disabled:opacity-50"
        >
          保存
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void organize()}
            className="flex-1 min-h-11 rounded-xl bg-slate-700 text-sm font-medium"
          >
            もう一度整理
          </button>
          <button
            type="button"
            onClick={() => void save(rawText)}
            className="flex-1 min-h-11 rounded-xl bg-slate-700 text-sm font-medium"
          >
            原文のまま保存
          </button>
        </div>
      </div>
    </div>
  )
}
