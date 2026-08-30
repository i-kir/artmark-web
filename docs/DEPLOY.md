# 公開・運用手順

ローカル（VSCode）→ GitHub → Vercel という流れで運用します。

## 1. GitHub にリポジトリを作る（初回のみ）

ブラウザで https://github.com/new を開き、次の設定で作成します。

- Repository name: `artmark-web`
- Public
- **README / .gitignore / license は追加しない**（すでにローカルにあるため）

作成後、ローカルからリモートを登録して push します。

```bash
cd ~/src/artmark-web
git remote add origin https://github.com/<あなたのユーザー名>/artmark-web.git
git push -u origin main
```

`gh` コマンドが入っている場合はこれだけで済みます。

```bash
cd ~/src/artmark-web
gh repo create artmark-web --public --source=. --remote=origin --push
```

## 2. Vercel と接続する（初回のみ）

1. https://vercel.com にアクセスし、**Continue with GitHub** でログイン
2. **Add New… → Project** をクリック
3. `artmark-web` を **Import**
4. 設定は自動検出されるので、以下を確認するだけでOK
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. **Deploy** をクリック

1〜2 分で `https://artmark-web-<ランダム>.vercel.app` が発行されます。
Project → Settings → Domains から `artmark-web.vercel.app` のような分かりやすい名前に変更できます。

## 3. 以降の運用

```bash
git switch -c feature/xxx     # ブランチを切る
npm run dev                   # VSCode で編集しながら確認
npm run build                 # 型チェック込みで確認
git add -A && git commit -m "feat: ..."
git push -u origin feature/xxx
```

- ブランチを push すると、Vercel が **プレビュー URL** を自動発行します（PR にコメントされます）
- GitHub で Pull Request を作成 → プレビューで確認 → `main` にマージ
- `main` にマージされると **本番 URL が自動で更新**されます

`main` に直接 push しても即本番反映されます。個人開発で速度優先ならこの運用でも構いません。

## 4. 環境変数を使うようになったら

Vercel の Project → Settings → Environment Variables に登録します。
Vite ではクライアントに露出する変数は `VITE_` 接頭辞が必要です（例: `VITE_API_BASE_URL`）。
ローカルは `.env.local` に置きます（`.gitignore` 済み）。

**注意**: `VITE_` 付きの変数はビルド結果に埋め込まれ、ブラウザから見えます。
API キーなどの秘密情報は入れないでください。

## 5. カスタムドメイン

Project → Settings → Domains でドメインを追加し、表示される DNS レコード
（A / CNAME）をドメイン管理会社側に設定します。証明書は Vercel が自動発行します。

## トラブルシューティング

| 症状 | 対処 |
| --- | --- |
| デプロイは成功するがページが真っ白 | ブラウザのコンソールを確認。多くはパス設定かビルド時エラー |
| `/search` を直接開くと 404 | `vercel.json` の `rewrites` が効いているか確認 |
| ローカルでは動くが Vercel でビルド失敗 | `npm run build` をローカルで実行して型エラーを確認 |
| 依存関係でビルド失敗 | `package-lock.json` をコミットしているか確認 |
