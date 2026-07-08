import { base64ToUtf8, utf8ToBase64 } from '../lib/base64'

export interface GithubConfig {
  owner: string
  repo: string
  token: string
}

export interface GithubFile {
  content: string
  sha: string
}

export class GithubApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'GithubApiError'
    this.status = status
  }
}

export interface GithubService {
  getFile(config: GithubConfig, path: string): Promise<GithubFile | null>
  putFile(
    config: GithubConfig,
    path: string,
    content: string,
    message: string,
    sha?: string,
  ): Promise<{ sha: string }>
  isRepoPrivate(config: GithubConfig): Promise<boolean>
  listEntryPaths(config: GithubConfig, branch?: string): Promise<string[]>
}

const API_BASE = 'https://api.github.com'

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export class HttpGithubService implements GithubService {
  async getFile(config: GithubConfig, path: string): Promise<GithubFile | null> {
    const url = `${API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}`
    const response = await fetch(url, { headers: authHeaders(config.token) })

    if (response.status === 404) return null
    if (response.status === 401) {
      throw new GithubApiError('GitHub のトークンが無効・失効しています', 401)
    }
    if (!response.ok) {
      throw new GithubApiError(`GitHub API エラー(status ${response.status})`, response.status)
    }

    const data = await response.json()
    return { content: base64ToUtf8(data.content), sha: data.sha }
  }

  async putFile(
    config: GithubConfig,
    path: string,
    content: string,
    message: string,
    sha?: string,
  ): Promise<{ sha: string }> {
    const url = `${API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}`
    const response = await fetch(url, {
      method: 'PUT',
      headers: { ...authHeaders(config.token), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        content: utf8ToBase64(content),
        ...(sha ? { sha } : {}),
      }),
    })

    if (response.status === 401) {
      throw new GithubApiError('GitHub のトークンが無効・失効しています', 401)
    }
    if (response.status === 409 || response.status === 422) {
      throw new GithubApiError('保存が競合しました。最新の内容を取得してやり直してください', response.status)
    }
    if (!response.ok) {
      throw new GithubApiError(`GitHub API エラー(status ${response.status})`, response.status)
    }

    const data = await response.json()
    return { sha: data.content.sha }
  }

  async isRepoPrivate(config: GithubConfig): Promise<boolean> {
    const url = `${API_BASE}/repos/${config.owner}/${config.repo}`
    const response = await fetch(url, { headers: authHeaders(config.token) })
    if (!response.ok) {
      throw new GithubApiError(`GitHub API エラー(status ${response.status})`, response.status)
    }
    const data = await response.json()
    return Boolean(data.private)
  }

  async listEntryPaths(config: GithubConfig, branch = 'main'): Promise<string[]> {
    const url = `${API_BASE}/repos/${config.owner}/${config.repo}/git/trees/${branch}?recursive=1`
    const response = await fetch(url, { headers: authHeaders(config.token) })
    if (!response.ok) {
      throw new GithubApiError(`GitHub API エラー(status ${response.status})`, response.status)
    }
    const data = await response.json()
    return (data.tree as { path: string; type: string }[])
      .filter((item) => item.type === 'blob' && item.path.startsWith('entries/') && item.path.endsWith('.md'))
      .map((item) => item.path)
  }
}

export class MockGithubService implements GithubService {
  private files = new Map<string, GithubFile>()
  public repoPrivate = true

  async getFile(_config: GithubConfig, path: string): Promise<GithubFile | null> {
    return this.files.get(path) ?? null
  }

  async putFile(
    _config: GithubConfig,
    path: string,
    content: string,
    _message: string,
    sha?: string,
  ): Promise<{ sha: string }> {
    const existing = this.files.get(path)
    if (existing && sha && existing.sha !== sha) {
      throw new GithubApiError('保存が競合しました。最新の内容を取得してやり直してください', 409)
    }
    const newSha = `sha-${this.files.size}-${Date.now()}`
    this.files.set(path, { content, sha: newSha })
    return { sha: newSha }
  }

  async isRepoPrivate(): Promise<boolean> {
    return this.repoPrivate
  }

  async listEntryPaths(): Promise<string[]> {
    return [...this.files.keys()].filter((p) => p.startsWith('entries/') && p.endsWith('.md'))
  }
}
