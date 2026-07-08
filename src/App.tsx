import { useState } from 'react'
import { BottomNav, type NavTab } from './components/BottomNav'
import { InputPage } from './pages/InputPage'
import { ReviewPage } from './pages/ReviewPage'
import { SettingsPage } from './pages/SettingsPage'

function App() {
  const [tab, setTab] = useState<NavTab>('input')

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto">
        {tab === 'input' && <InputPage />}
        {tab === 'review' && <ReviewPage />}
        {tab === 'settings' && <SettingsPage />}
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

export default App
