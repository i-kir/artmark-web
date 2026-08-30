# データ調達の手引き

ArtMark で一番難しく、一番価値があるのがここです。
映画の TMDb にあたる「展覧会の網羅的なオープンデータ」は日本に存在しません。
自分たちで集めるしかなく、集めた分だけがそのままサービスの強みになります。

データは3つの経路で入ってきます。どれも `source` 列に記録され、画面にも出典が表示されます。

| 経路 | 対象 | ライセンス・根拠 |
| --- | --- | --- |
| Wikidata | 美術館マスタ | CC0（パブリックドメイン） |
| 巡回取得 | 展覧会 | 事実情報のみ。robots.txt と各サイトの利用規約に従う |
| ユーザー投稿 | 展覧会 | 投稿者本人の記述 |

---

## 1. 美術館マスタを Wikidata から取り込む

Wikidata のデータは CC0 なので、出典を書けば自由に使えます。
座標を持つ日本の美術館を、まとめて取得できます。

```bash
cd ~/src/artmark-web
node scripts/data/fetch-wikidata-museums.mjs --limit 300
```

`supabase/migrations/0006_museums_wikidata.sql` が生成されます。
**中身を確認してから** Supabase の SQL Editor で実行してください。

開館時間・休館日・紹介文は Wikidata にありません。空欄で入るので、
主要館だけ後から手で埋めるか、公式サイトから補完します。

---

## 2. 展覧会を巡回取得する

### 守っていること

法的・倫理的に踏み外さないよう、スクリプト側に組み込んであります。

- **robots.txt を必ず確認する** — 拒否されているパスは取得しません。
  robots.txt が読めないときも、安全側に倒して取得しません
- **1秒に1回まで** — 同一ホストへの間隔を空けます（`ARTMARK_CRAWL_INTERVAL_MS`）
- **名乗る** — 連絡先を含む User-Agent を送ります（`ARTMARK_USER_AGENT`）
- **変わっていなければ貰わない** — ETag / Last-Modified で条件付き GET します
- **事実だけを取る** — 名称・会期・料金・公式URL のみ。**紹介文は複製しません**。
  事実そのものに著作権はありませんが、紹介文や写真にはあります
- **必ず公式へ送り返す** — 詳細ページには公式サイトへのリンクを出します

### 取得先を追加する

`scripts/data/sources.json` に1件追加します。**追加前に必ず利用規約を読んでください。**
自動取得を禁じる条項があるサイトは対象外です。

```json
{
  "id": "momat",
  "museumId": "m1",
  "museumName": "東京国立近代美術館",
  "listUrl": "https://www.momat.go.jp/exhibitions",
  "termsUrl": "https://www.momat.go.jp/",
  "termsCheckedAt": "2026-08-30",
  "termsNote": "利用規約を確認。自動取得を禁じる条項なし。",
  "enabled": true
}
```

`termsCheckedAt` が空のものは、スクリプトが取得を拒否します。
「確認したことにする」ためではなく、確認を忘れないための仕掛けです。

### 実行する

```bash
# robots.txt と規約の確認だけ（取得はしない）
node scripts/data/crawl.mjs --check

# 取得して結果を表示（保存しない）
node scripts/data/crawl.mjs --dry-run

# 取得して scripts/data/data/exhibitions.json に保存
node scripts/data/crawl.mjs

# 1件だけ試す
node scripts/data/crawl.mjs --only momat --dry-run
```

### 構造化データが無いサイト

まず schema.org の JSON-LD（`ExhibitionEvent` / `Event`）を探します。
最近のサイトの多くはこれを埋めており、HTML の見た目に依存しないので一番壊れにくい方法です。

見つからない場合は「個別の抽出処理が必要」と表示されます。
その館向けの抽出関数を `scripts/data/lib/` に追加することになりますが、
**CSS セレクタ頼みの抽出はサイト改修のたびに壊れます。** 数が増えると保守しきれません。

現実的には、JSON-LD のある館だけ自動取得し、残りはユーザー投稿で補うのが長続きします。

---

## 3. Supabase に投入する

```bash
cp .env.scripts.example .env.scripts
# SUPABASE_SERVICE_ROLE_KEY を記入（Project Settings → API から取得）

node scripts/data/ingest.mjs --dry-run   # 何が入るか確認
node scripts/data/ingest.mjs             # 実行
```

**`service_role` キーは RLS を無視できる管理者キーです。**
`.env.scripts` は `.gitignore` 済みですが、`VITE_` 変数に入れたり
Vercel に設定したりは絶対にしないでください。漏れたら即ローテートします。

同じ館・同じ開始日・同じタイトルは同一の展覧会とみなして更新します
（`exhibitions_dedupe_key`）。何度実行しても増殖しません。

### 定期実行

慣れてきたら GitHub Actions で回せます。`SUPABASE_SERVICE_ROLE_KEY` は
リポジトリの Secrets に置きます。週1回で十分です。展覧会の会期は
そう頻繁には変わりません。

---

## 4. ユーザー投稿

ログインすれば誰でも `/exhibition/new` から登録でき、**すぐ公開されます**。
承認待ちの行列を作らなかったのは、さばく人がいないと投稿ごと死ぬためです。

品質は次の2つで担保します。

- 登録者本人だけが後から編集できる（RLS で制限）
- 誰でも「情報の誤りを報告」から通報できる

通報は `reports` テーブルに入ります。管理者だけが読めます。

### 自分を管理者にする

`supabase/migrations/0005_data_sources.sql` の末尾にコメントアウトされた
SQL があります。メールアドレスを自分のものに変えて実行してください。

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'あなたのメールアドレス');
```

### 通報を見る

いまは専用画面がありません。Supabase の Table Editor で `reports` を開き、
`status = 'open'` の行を確認してください。件数が増えたら管理画面を作ります。

---

## 現実的な進め方

1. Wikidata で美術館を300件ほど入れる（1回で終わる）
2. 主要館のうち JSON-LD があるものを5〜10件、巡回取得の対象にする
3. 残りはユーザー投稿で埋まるのを待ちつつ、自分でも登録する

**「自分が観た展覧会がない」で離脱される**のが最大のリスクです。
網羅性が上がるまでは、エリアやジャンルを絞って「この範囲なら揃っている」
状態を作るほうが、全国を薄く覆うより体験が良くなります。
