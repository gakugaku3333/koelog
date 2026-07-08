export type NavTab = 'input' | 'review' | 'settings'

const TABS: { key: NavTab; label: string }[] = [
  { key: 'input', label: '記録する' },
  { key: 'review', label: '振り返り' },
  { key: 'settings', label: '設定' },
]

export function BottomNav({
  active,
  onChange,
}: {
  active: NavTab
  onChange: (tab: NavTab) => void
}) {
  return (
    <nav className="flex border-t border-slate-800 bg-slate-900">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`flex-1 py-3 text-sm font-medium min-h-11 ${
            active === tab.key ? 'text-sky-400' : 'text-slate-400'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
