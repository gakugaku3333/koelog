import { useEffect, useState } from 'react'
import { BottomNav, type NavTab } from './components/BottomNav'
import { InputPage } from './pages/InputPage'
import { ReviewPage } from './pages/ReviewPage'
import { SettingsPage } from './pages/SettingsPage'
import { HttpGithubService } from './services/githubService'
import { flushOutbox } from './services/outboxService'
import { loadSettings, toGithubConfig } from './services/settingsService'

function App() {
  const [tab, setTab] = useState<NavTab>('input')

  useEffect(() => {
    async function tryFlush() {
      const settings = await loadSettings()
      const config = toGithubConfig(settings)
      if (!config) return
      try {
        await flushOutbox(new HttpGithubService(), config)
      } catch {
        // 401等の致命的エラーは設定画面で再設定してもらう。ここでは静かに諦める
      }
    }
    void tryFlush()
    window.addEventListener('online', tryFlush)
    return () => window.removeEventListener('online', tryFlush)
  }, [])

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
