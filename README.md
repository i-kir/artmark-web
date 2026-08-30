# ArtMark

美術館・展覧会のクチコミサイト（プロトタイプ）。
美術館と展覧会をさがし、「行きたい／行った」をクリップして、星評価つきの感想を投稿できます。

現時点ではバックエンドを持たず、データは `src/data/` のモックを読み込むフロントエンド単体の SPA です。

## 技術スタック

| 領域 | 使用技術 |
| --- | --- |
| ビルド | Vite 5 |
| UI | React 18 + TypeScript 5.6 |
| ルーティング | React Router 6 |
| スタイル | Tailwind CSS 3 |
| Lint | ESLint 9 (typescript-eslint) |
| ホスティング | Vercel |

## セットアップ

```bash
npm install
npm run dev      # http://localhost:5173
```

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 型チェック（`tsc -b`）と本番ビルド → `dist/` |
| `npm run preview` | ビルド結果をローカルで配信 |
| `npm run lint` | ESLint を実行 |

## ディレクトリ構成

```
src/
├── components/   カード・星評価・クリップボタンなどの共通 UI
├── contexts/     ReviewContext（レビュー）/ ClipContext（行きたい・行った）
├── data/         モックデータ（美術館 10 / 展覧会 15 / レビュー 20 件）
├── pages/        Home, Search, MyPage, MuseumDetail, ExhibitionDetail, ReviewNew
├── types/        Museum, Exhibition, Review, User, ClipStatus
└── App.tsx       ルーティング定義
```

`@` は `src` のエイリアスです（`vite.config.ts` / `tsconfig.app.json`）。

## 画面とルート

| ルート | 画面 |
| --- | --- |
| `/` | ホーム（開催中の展覧会・人気の美術館） |
| `/search` | 検索（エリア・ジャンル・キーワード） |
| `/museum/:id` | 美術館詳細 |
| `/exhibition/:id` | 展覧会詳細 |
| `/review/new` | レビュー投稿 |
| `/mypage` | マイページ（クリップ一覧・自分のレビュー） |

## デプロイ

`main` ブランチへの push で Vercel が自動ビルド・自動公開します。
プルリクエストごとにプレビュー URL が発行されます。

- ビルドコマンド: `npm run build`
- 出力ディレクトリ: `dist`
- SPA のリライト設定は `vercel.json` に定義済み

## 開発フロー

```bash
git switch -c feature/xxx    # ブランチを切る
# VSCode で編集し、npm run dev で確認
npm run lint && npm run build
git add -A && git commit -m "..."
git push -u origin feature/xxx
```

GitHub でプルリクエストを作成 → Vercel のプレビュー URL で確認 → `main` にマージで本番反映。

## データの保持について

レビューとクリップ（行きたい／行った）はブラウザの localStorage に保存されます
（キー: `@artmark_reviews` / `@artmark_clips`）。
そのため同じブラウザなら再訪時も残りますが、端末をまたいだ共有はできません。

## 今後の方針

「美術館・展覧会版 Filmarks」を目標に、バックエンド導入 → 社会性 → 発見機能
の順で拡張していきます。詳細は [docs/ROADMAP.md](docs/ROADMAP.md) を参照してください。
