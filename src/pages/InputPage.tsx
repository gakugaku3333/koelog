import { useEffect, useRef, useState } from 'react'
import { db } from '../db/schema'
import { countEntriesForDate } from '../services/localCache'
import { loadSettings, toGithubConfig } from '../services/settingsService'
import { formatDate } from '../lib/dateFormat'
import { ReviewScreen } from './ReviewScreen'

type Stage = 'loading' | 'input' | 'review'

export function InputPage() {
  const [stage, setStage] = useState<Stage>('loading')
  const [text, setText] = useState('')
  const [todayCount, setTodayCount] = useState(0)
  const [needsSetup, setNeedsSetup] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    ;(async () => {
      const draft = await db.drafts.get('current')
      const settings = await loadSettings()
      const today = formatDate(new Date())
      setText(draft?.text ?? '')
      setTodayCount(await countEntriesForDate(today))
      setNeedsSetup(!settings.geminiApiKey || !toGithubConfig(settings))
      setStage('input')
    })()
  }, [])

  function handleChange(value: string) {
    setText(value)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      db.drafts.put({ id: 'current', text: value, updatedAt: new Date().toISOString() })
    }, 400)
  }

  if (stage === 'loading') {
    return <div className="p-4 text-sm text-slate-400">読み込み中…</div>
  }

  if (stage === 'review') {
    return (
      <ReviewScreen
        rawText={text}
        onBackToInput={() => setStage('input')}
        onSaved={async () => {
          setText('')
          setStage('input')
          setTodayCount(await countEntriesForDate(formatDate(new Date())))
        }}
      />
    )
  }

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <h1 className="text-lg font-semibold">今日の記録</h1>
      <p className="text-sm text-slate-400">
        今日のことを話してください。マイクボタンで音声入力できます。
      </p>
      {todayCount > 0 && (
        <p className="text-xs text-slate-500">今日は {todayCount + 1} 件目の記録です</p>
      )}
      {needsSetup && (
        <p className="text-xs text-amber-400">
          先に「設定」タブで Gemini API キーと GitHub の情報を入力してください
        </p>
      )}
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        className="flex-1 w-full rounded-xl bg-slate-800 p-4 text-base leading-relaxed resize-none outline-none focus:ring-2 focus:ring-sky-400"
        placeholder="ここをタップして話しはじめてください"
      />
      <button
        type="button"
        disabled={!text.trim() || needsSetup}
        onClick={() => setStage('review')}
        className="w-full rounded-xl bg-sky-500 py-3.5 text-base font-semibold text-slate-900 active:bg-sky-400 disabled:opacity-40"
      >
        整理する
      </button>
    </div>
  )
}
