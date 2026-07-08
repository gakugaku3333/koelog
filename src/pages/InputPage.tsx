export function InputPage() {
  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <h1 className="text-lg font-semibold">今日の記録</h1>
      <p className="text-sm text-slate-400">
        今日のことを話してください。マイクボタンで音声入力できます。
      </p>
      <textarea
        className="flex-1 w-full rounded-xl bg-slate-800 p-4 text-base leading-relaxed resize-none outline-none focus:ring-2 focus:ring-sky-400"
        placeholder="ここをタップして話しはじめてください"
      />
      <button
        type="button"
        className="w-full rounded-xl bg-sky-500 py-3.5 text-base font-semibold text-slate-900 active:bg-sky-400"
      >
        整理する
      </button>
    </div>
  )
}
