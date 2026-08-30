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
| データ / 認証 | Supabase (PostgreSQL, Auth) |
| 地図 | Leaflet + OpenStreetMap |
| データ取得 | TanStack Query |
| Lint | ESLint 9 (typescript-eslint) |
| ホスティング | Vercel |

## セットアップ

```bash
npm install
cp .env.example .env.local   # Supabase の URL と anon key を記入
npm run dev                  # http://localhost:5173
```

Supabase プロジェクトの作成からテーブル投入までの手順は
[docs/SUPABASE.md](docs/SUPABASE.md) を参照してください。
環境変数が未設定の場合、画面に設定を促すメッセージが表示されます。

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
├── api/          Supabase へのクエリ（masters, ratings, reviews, clips）
├── hooks/        TanStack Query のフック群
├── lib/          Supabase クライアント、会期計算などの純粋な関数
├── components/   カード・星評価・クリップボタンなどの共通 UI
├── contexts/     AuthContext（セッションとプロフィール）
├── pages/        Home, Search, MyPage, 詳細ページ, ReviewNew, Login ほか
├── types/        Museum, Exhibition, Review, Profile, Clip
└── App.tsx       ルーティングと Provider の定義

supabase/migrations/  スキーマ（0001）、初期データ（0002）、社会性（0003）、座標（0004）
scripts/              seed 生成、Wikidata 取得、巡回取得と投入
docs/                 セットアップ・デプロイ・ロードマップ・データ調達
```

`@` は `src` のエイリアスです（`vite.config.ts` / `tsconfig.app.json`）。

## 画面とルート

| ルート | 画面 |
| --- | --- |
| `/` | ホーム（まもなく終了する展覧会・開催中・最新レビュー） |
| `/search` | 検索（キーワード・ジャンル・エリア・会期・現在地から近い順） |
| `/map` | 地図から探す（現在地・開催中の絞り込み） |
| `/museum/:id` | 美術館詳細 |
| `/exhibition/:id` | 展覧会詳細 |
| `/users` | ユーザー検索 |
| `/u/:handle` | 公開プロフィール（レビュー・フォロー・フォロワー） |
| `/tag/:tag` | タグ別のレビュー一覧 |
| `/timeline` | タイムライン（フォロー中のレビュー、要ログイン） |
| `/exhibition/new` | 展覧会の登録（要ログイン） |
| `/exhibition/:id/edit` | 展覧会の編集（自分の登録分のみ） |
| `/review/new` | レビュー投稿（要ログイン） |
| `/mypage` | マイページ（クリップ・自分のレビュー、要ログイン） |
| `/settings/profile` | プロフィール編集（要ログイン） |
| `/login` | ログイン・新規登録（マジックリンク / パスワード） |

## デプロイ

`main` ブランチへの push で Vercel が自動ビルド・自動公開します。
プルリクエストごとにプレビュー URL が発行されます。

- ビルドコマンド: `npm run build`
- 出力ディレクトリ: `dist`
- SPA のリライト設定は `vercel.json` に定義済み
- Vercel 側にも `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` の設定が必要です
  （環境変数はビルド時に埋め込まれるため、追加後は再デプロイしてください）

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

レビューとクリップは Supabase に保存され、端末をまたいで共有されます。
レビューは誰でも読めますが、クリップ（行きたい／行った）は本人にしか見えません。
アクセス制御は Row Level Security で行っています。詳細は
[docs/SUPABASE.md](docs/SUPABASE.md) の「データ設計のポイント」を参照してください。

## 今後の方針

「美術館・展覧会版 Filmarks」を目標に、バックエンド導入 → 社会性 → 発見機能
の順で拡張していきます。詳細は [docs/ROADMAP.md](docs/ROADMAP.md) を参照してください。
