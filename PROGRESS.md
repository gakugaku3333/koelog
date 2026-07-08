# 進捗・決定事項

計画ドキュメントは `../音声振り返り日誌/` 配下(00〜04)。実装はこのファイルに進捗と決定事項を追記していく。

## フェーズ0: プロジェクト土台とデプロイパイプライン

- Vite + React + TypeScript で `koelog-app` を作成。Tailwind は v4 のため `@tailwindcss/vite` プラグイン方式を採用(`tailwind.config.js` 不要)
- `vite-plugin-pwa` でマニフェスト・Service Worker を設定。`base: '/koelog/'` (GitHub Pages のリポジトリ名に合わせる)
- Vitest は `vitest/config` の `defineConfig` を使わないと `vite.config.ts` の `test` フィールドが型エラーになる点に注意
- アイコンは `sharp` を一時インストールしてSVGから192/512のPNGを生成後、`sharp` はアンインストール(依存を増やさない方針のため)
- GitHub リポジトリ: アプリ = `gakugaku3333/koelog`(Public、Pages配信用)、データ = `gakugaku3333/koelog-data`(Private)
- デプロイ: `.github/workflows/deploy.yml` で main push 時に GitHub Pages へ自動デプロイ(actions/deploy-pages)
- ボトムナビ(記録する/振り返り/設定)の空画面を実装、プレビューで動作確認済み

**未実施(発注者の実機確認が必要)**: GitHub 側で Pages を「GitHub Actions」ソースに設定する操作(リポジトリ Settings → Pages)。これは Web UI 操作のため実装セッションでは行っていない。次回、発注者に依頼するか、`gh api` で設定する。

## 次にやること(フェーズ1)

- 設定画面(Gemini キー・GitHub owner/repo/PAT 入力と接続テスト)
- markdownCodec(1日1ファイルのパース/シリアライズ、UTF-8⇄Base64往復)のユニットテストから着手
- geminiService / githubService / outbox
