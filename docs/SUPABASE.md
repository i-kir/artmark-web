# Supabase セットアップ手順

ArtMark のデータと認証は Supabase（PostgreSQL + 認証）に置いています。
このドキュメントの手順を上から順に実行すれば、ローカルと本番の両方が動きます。

所要時間はおよそ 20 分です。

---

## 1. プロジェクトを作る

1. https://supabase.com にアクセスし、**Start your project** から GitHub でサインイン
2. **New project** をクリック
3. 入力内容
   - Name: `artmark`
   - Database Password: 自動生成されたものをパスワードマネージャに保存
     （このパスワードはアプリからは使いませんが、紛失すると DB に直接繋げなくなります）
   - Region: **Northeast Asia (Tokyo)**
   - Plan: Free
4. **Create new project** → 2分ほどで準備完了

## 2. テーブルを作る

1. 左メニューの **SQL Editor** を開く
2. `supabase/migrations/0001_init.sql` の中身をすべて貼り付けて **Run**
3. 続けて `supabase/migrations/0002_seed_masters.sql` を貼り付けて **Run**

`Success. No rows returned` と出れば成功です。
左メニューの **Table Editor** に `museums` と `exhibitions` が並び、
美術館10件・展覧会15件が入っていることを確認してください。

> `0002` は upsert で書いてあるので、何度実行しても重複しません。
> モックデータを編集したら `node scripts/generate-seed.mjs > supabase/migrations/0002_seed_masters.sql`
> で作り直せます。

## 3. 認証を設定する

左メニュー **Authentication → URL Configuration** で以下を設定します。
ここを間違えるとログインリンクを踏んでも戻ってこられません。

| 項目 | 値 |
| --- | --- |
| Site URL | `https://artmark-web.vercel.app` |
| Redirect URLs | `http://localhost:5173/**` と `https://artmark-web.vercel.app/**` の2つを追加 |

**Authentication → Providers → Email** で、
`Confirm email` が ON、`Enable Email provider` が ON になっていることを確認してください
（マジックリンクはこの設定で動きます。パスワードは使いません）。

> 無料枠のメール送信は 1時間あたり数通の制限があります。
> 開発中に連続でログインを試すと詰まるので、その場合は少し待ってください。
> 本番運用に入るときは Resend や SendGrid などの SMTP を設定します。

## 4. ローカルの環境変数

**Project Settings → API** を開き、次の2つをコピーします。

- **Project URL**
- **anon public** キー

プロジェクト直下に `.env.local` を作成します（`.gitignore` 済みなのでコミットされません）。

```bash
cd ~/src/artmark-web
cp .env.example .env.local
```

`.env.local` を編集してコピーした値を貼り付けます。

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> **anon key はブラウザに露出する公開鍵**です。GitHub に上げても致命傷ではありませんが、
> `service_role` キーは絶対にフロントエンドや Git に置かないでください。
> データを守っているのは鍵の秘密性ではなく、`0001_init.sql` で設定した
> Row Level Security です。

開発サーバーを再起動して反映します。

```bash
npm run dev
```

## 5. Vercel の環境変数

本番でも同じ2つを設定します。

1. Vercel の `artmark-web` プロジェクト → **Settings → Environment Variables**
2. `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を追加
   （Production / Preview / Development すべてにチェック）
3. **Deployments** タブから最新のデプロイを **Redeploy**

環境変数はビルド時に埋め込まれるため、**追加しただけでは反映されません。**
必ず再デプロイしてください。

## 6. 動作確認

1. `/login` でメールアドレスを入力 → 届いたリンクを開く
2. `/mypage` に自分のプロフィールが表示される
3. 展覧会ページで「クリップ」を押す → マイページの「行きたい」に出る
4. 「レビューを書く」から投稿 → 展覧会ページとホームの最新レビューに出る
5. ログアウトした状態でも他人のレビューが読める（ここが localStorage 時代との決定的な違いです）

---

## データ設計のポイント

**平均スコアはテーブルに保存していません。** `target_ratings` ビューで
レビューから毎回集計しています。保存すると必ずどこかで実際の値とずれるためです。
レビュー件数が増えて重くなったら、マテリアライズドビューか集計テーブル + トリガーに変えます。

**Row Level Security（RLS）がアクセス制御の本体です。**
anon key は誰でも見られる前提なので、「誰が何を読み書きできるか」は
すべて `0001_init.sql` のポリシーで決めています。

- 美術館・展覧会・レビュー・プロフィールは誰でも読める
- レビューの作成・編集・削除は本人のみ
- **クリップ（行きたい／行った）は本人しか読めない**
  「行きたい」は他人に見せたくない情報だと判断しました。公開したくなったら
  プロフィールに公開設定を足して、ポリシーを緩めます。

**レビューは1ユーザー1対象につき1件です。**
`unique (user_id, target_type, target_id)` を張り、投稿は upsert にしています。
同じ展覧会に何度も行って追記したい、というニーズが出たら再訪レビューの設計を考えます。

## トラブルシューティング

| 症状 | 原因と対処 |
| --- | --- |
| 画面に「Supabase に接続できていません」と出る | `.env.local` がないか、開発サーバーを再起動していない |
| `Failed to fetch` が出る | Vite は起動時にしか `.env.local` を読まない。`Ctrl+C` で止めて `npm run dev` をやり直す |
| メールのリンクが本番 URL に飛ぶ | `redirect_to` にパスが付いていなければ Site URL への差し戻し。Redirect URLs に `http://localhost:5173/**` を登録してから**送り直す**（リンクは1回限り有効） |
| メールが届かない | 迷惑メールフォルダを確認。無料枠の送信レート制限にかかっている可能性もある |
| データは入っているのに一覧が空 | RLS の select ポリシーが作られていない。`0001_init.sql` の後半を再実行 |
| `Could not embed because more than one relationship was found` | テーブル間に関係が複数あるため曖昧。`profiles!reviews_user_id_fkey` のように外部キー名で明示する |
| 本番だけ動かない | Vercel の環境変数を追加後に再デプロイしていない |
| `Cannot find module @rollup/rollup-darwin-arm64` | 別 OS で `npm install` された `node_modules` が残っている。`rm -rf node_modules && npm install` で入れ直す |
