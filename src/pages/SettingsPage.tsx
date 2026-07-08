import { useEffect, useState } from 'react'
import { DEFAULT_GEMINI_MODEL, GeminiApiError, HttpGeminiService } from '../services/geminiService'
import { GithubApiError, HttpGithubService } from '../services/githubService'
import { loadSettings, saveSettings, toGithubConfig } from '../services/settingsService'

type TestState = 'idle' | 'testing' | 'ok' | 'error'

export function SettingsPage() {
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [geminiModel, setGeminiModel] = useState(DEFAULT_GEMINI_MODEL)
  const [githubOwner, setGithubOwner] = useState('')
  const [githubRepo, setGithubRepo] = useState('')
  const [githubToken, setGithubToken] = useState('')

  const [geminiTest, setGeminiTest] = useState<TestState>('idle')
  const [geminiTestMessage, setGeminiTestMessage] = useState('')
  const [githubTest, setGithubTest] = useState<TestState>('idle')
  const [githubTestMessage, setGithubTestMessage] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSettings().then((s) => {
      setGeminiApiKey(s.geminiApiKey ?? '')
      setGeminiModel(s.geminiModel ?? DEFAULT_GEMINI_MODEL)
      setGithubOwner(s.githubOwner ?? '')
      setGithubRepo(s.githubRepo ?? '')
      setGithubToken(s.githubToken ?? '')
    })
  }, [])

  async function handleSave() {
    await saveSettings({ geminiApiKey, geminiModel, githubOwner, githubRepo, githubToken })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function testGemini() {
    setGeminiTest('testing')
    setGeminiTestMessage('')
    try {
      const service = new HttpGeminiService()
      await service.organize('接続テストです。', geminiApiKey, geminiModel)
      setGeminiTest('ok')
    } catch (error) {
      setGeminiTest('error')
      setGeminiTestMessage(error instanceof GeminiApiError ? error.message : '接続に失敗しました')
    }
  }

  async function testGithub() {
    setGithubTest('testing')
    setGithubTestMessage('')
    const config = toGithubConfig({ id: 'app', githubOwner, githubRepo, githubToken })
    if (!config) {
      setGithubTest('error')
      setGithubTestMessage('リポジトリ名とトークンをすべて入力してください')
      return
    }
    try {
      const service = new HttpGithubService()
      const isPrivate = await service.isRepoPrivate(config)
      if (!isPrivate) {
        setGithubTest('error')
        setGithubTestMessage('警告: このリポジトリは公開(Public)設定です。非公開リポジトリを使ってください')
        return
      }
      setGithubTest('ok')
    } catch (error) {
      setGithubTest('error')
      setGithubTestMessage(error instanceof GithubApiError ? error.message : '接続に失敗しました')
    }
  }

  return (
    <div className="flex flex-col h-full p-4 gap-6 overflow-y-auto">
      <h1 className="text-lg font-semibold">設定</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium">Gemini API</h2>
        <label className="text-sm text-slate-400">
          API キー
          <input
            type="password"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2.5 text-base text-slate-100 outline-none focus:ring-2 focus:ring-sky-400"
            placeholder="Google AI Studio で発行したキー"
          />
        </label>
        <label className="text-sm text-slate-400">
          モデル
          <input
            type="text"
            value={geminiModel}
            onChange={(e) => setGeminiModel(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2.5 text-base text-slate-100 outline-none focus:ring-2 focus:ring-sky-400"
          />
        </label>
        <button
          type="button"
          onClick={testGemini}
          disabled={!geminiApiKey || geminiTest === 'testing'}
          className="min-h-11 rounded-lg bg-slate-700 px-4 text-sm font-medium disabled:opacity-50"
        >
          {geminiTest === 'testing' ? '接続確認中…' : '接続テスト'}
        </button>
        {geminiTest === 'ok' && <p className="text-sm text-emerald-400">接続できました</p>}
        {geminiTest === 'error' && <p className="text-sm text-rose-400">{geminiTestMessage}</p>}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium">GitHub(記録の保存先)</h2>
        <label className="text-sm text-slate-400">
          アカウント名(owner)
          <input
            type="text"
            value={githubOwner}
            onChange={(e) => setGithubOwner(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2.5 text-base text-slate-100 outline-none focus:ring-2 focus:ring-sky-400"
            placeholder="例: gakugaku3333"
          />
        </label>
        <label className="text-sm text-slate-400">
          リポジトリ名
          <input
            type="text"
            value={githubRepo}
            onChange={(e) => setGithubRepo(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2.5 text-base text-slate-100 outline-none focus:ring-2 focus:ring-sky-400"
            placeholder="例: koelog-data"
          />
        </label>
        <label className="text-sm text-slate-400">
          Fine-grained Personal Access Token
          <input
            type="password"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2.5 text-base text-slate-100 outline-none focus:ring-2 focus:ring-sky-400"
            placeholder="ghp_... / github_pat_..."
          />
        </label>
        <p className="text-xs text-slate-500">
          GitHub の Settings → Developer settings → Fine-grained tokens
          で、上記リポジトリ1つだけを対象に、Contents 権限を Read and write にして発行してください。
        </p>
        <button
          type="button"
          onClick={testGithub}
          disabled={githubTest === 'testing'}
          className="min-h-11 rounded-lg bg-slate-700 px-4 text-sm font-medium disabled:opacity-50"
        >
          {githubTest === 'testing' ? '接続確認中…' : '接続テスト'}
        </button>
        {githubTest === 'ok' && <p className="text-sm text-emerald-400">接続できました(非公開リポジトリを確認)</p>}
        {githubTest === 'error' && <p className="text-sm text-rose-400">{githubTestMessage}</p>}
      </section>

      <button
        type="button"
        onClick={handleSave}
        className="min-h-11 rounded-xl bg-sky-500 py-3 text-base font-semibold text-slate-900 active:bg-sky-400"
      >
        {saved ? '保存しました' : '保存する'}
      </button>
    </div>
  )
}
