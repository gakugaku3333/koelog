# 進捗・決定事項

計画ドキュメントは `../` (このリポジトリの親フォルダ)配下(00〜04)。実装はこのファイルに進捗と決定事項を追記していく。

## フェーズ0: プロジェクト土台とデプロイパイプライン

- Vite + React + TypeScript でアプリ(`音声振り返り日誌/app`、GitHub上は `koelog` リポジトリ)を作成。Tailwind は v4 のため `@tailwindcss/vite` プラグイン方式を採用(`tailwind.config.js` 不要)
- `vite-plugin-pwa` でマニフェスト・Service Worker を設定。`base: '/koelog/'` (GitHub Pages のリポジトリ名に合わせる)
- Vitest は `vitest/config` の `defineConfig` を使わないと `vite.config.ts` の `test` フィールドが型エラーになる点に注意
- アイコンは `sharp` を一時インストールしてSVGから192/512のPNGを生成後、`sharp` はアンインストール(依存を増やさない方針のため)
- GitHub リポジトリ: アプリ = `gakugaku3333/koelog`(Public、Pages配信用)、データ = `gakugaku3333/koelog-data`(Private)
- デプロイ: `.github/workflows/deploy.yml` で main push 時に GitHub Pages へ自動デプロイ(actions/deploy-pages)
- ボトムナビ(記録する/振り返り/設定)の空画面を実装、プレビューで動作確認済み

**実施済み**: `gh api` で GitHub Pages を Actions ソースに設定し、`https://gakugaku3333.github.io/koelog/` へのデプロイを確認済み(200 OK)。

## フェーズ1: MVP(音声入力→Gemini整理→GitHub保存)

- Gemini モデルは実装時点(2026-07)の公式ドキュメント調査で無料枠のある `gemini-2.5-flash` を既定値に採用(3.5系も無料枠ありだが安定実績のある2.5系を選択。設定画面でモデル名は変更可能)
- `src/lib/markdownCodec.ts`: 1日1ファイル(`## HH:MM` 見出し + `<details>`原文)のパース/シリアライズ。往復テスト済み(0件・1件・複数件・記号混入ケース)
- `src/lib/base64.ts`: UTF-8⇄Base64 往復(`btoa` 直呼びを避け `TextEncoder`/`TextDecoder` 経由)。日本語・絵文字でテスト済み。**さらに実際の GitHub Contents API(`gh api`)に日本語+絵文字入りファイルを PUT→GET して往復が壊れないことを実地検証済み**(検証用ファイルは削除済み)
- `src/services/`: geminiService(Http実装+モック)/ githubService(Http実装+モック、sha競合時エラー)/ entryService(GET→追記→PUT のリトライ、index.json 更新)/ outboxService(オフライン・失敗時のキューと再送、401時は打ち切り)/ recordService(ローカルキャッシュへ即時反映してから送信。**入力が失われない設計**)/ settingsService
- UI: 設定画面(Gemini・GitHub接続テストボタン、Publicリポジトリ警告)/ 入力画面(下書き自動保存・当日件数表示)/ 整理結果画面(編集可・原文折りたたみ・エラー時の「原文のまま保存」導線)
- Vitest: 全 20 テスト成功(`fake-indexeddb` を導入し Dexie の単体テストも可能に)
- プレビューで実際に「入力→整理(ダミーキーで意図的にエラー)→原文のまま保存→ローカルキャッシュ即時反映→GitHub送信失敗→outboxへキュー」の一連の流れを確認済み

**発注者に依頼したいこと(実機確認)**:
1. 設定画面で実際の Gemini API キーと GitHub の owner/repo(`koelog-data`)・Fine-grained PAT を入力し、両方の「接続テスト」が成功することを確認
2. iPhone で音声入力→整理→保存を行い、`koelog-data` リポジトリに Markdown が実際にコミットされることを確認
3. 機内モードで保存→オンライン復帰で自動再送されることを確認

## 次にやること(フェーズ2)

- syncService(index.json→差分の日次ファイル取得→entriesCache更新)
- 振り返り画面(カレンダー・一覧・検索・編集・削除)
- index.json 破損時の再構築(Trees API)
