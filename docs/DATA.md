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

### 抽出の順序（JSON-LD → LLM）

1. まず schema.org の JSON-LD（`ExhibitionEvent` / `Event`）を探します。
   HTML の見た目に依存しないので一番壊れにくい方法です。
2. JSON-LD から1件も取れなければ、`ANTHROPIC_API_KEY` がある場合に限り
   **Claude で一覧ページの本文から抽出**します（`scripts/data/lib/llm-extract.mjs`）。
   館ごとのパーサーを書かずに済み、サイトの改修にも強い方法です。

`sources.json` の `"extract"` で取得先ごとに固定できます（`"auto"` 既定 / `"jsonld"` / `"llm"`）。
`--no-llm` を付けると JSON-LD だけを使います。

```bash
# .env.scripts に ANTHROPIC_API_KEY を記入してから
node scripts/data/crawl.mjs --only mori --dry-run
```

LLM は誤った値を返すことがあるため、返ってきた値は必ず検証します。

- 日付は実在する `YYYY-MM-DD` で、終了日が開始日以降
- **タイトルが実際にページ本文に現れていること**（でっち上げの排除）
- 公式URLはページ内のリンクに実在するものだけ採用（無ければ一覧ページへ）
- 紹介文と画像は取らない（事実情報のみ）

却下された項目は理由つきで画面に表示されます。同じ本文・同じ日付なら前回の結果を
`scripts/data/.cache/llm.json` から再利用し、API を呼びません。
モデルは `ARTMARK_LLM_MODEL` で変えられます（既定は軽量な `claude-haiku-5-5`）。

注意点:

- JS で描画されるページ（本文が取れない）は抽出できません。その場合は明示エラーになります。
- **LLM 抽出でも、規約確認と robots.txt の遵守は同じく必須です。** 抽出方法が変わるだけで、
  取得してよいかの判断は変わりません。
- ページ本文は Anthropic の API に送られます（一覧ページの公開情報のみ）。

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

`.github/workflows/crawl-exhibitions.yml` が、毎週月曜 06:17 JST に
`crawl.mjs` → `ingest.mjs` を実行します。展覧会の会期はそう頻繁には変わらないので週1回で十分です。

**リポジトリの設定（Settings → Secrets and variables → Actions）**

| 種別 | 名前 | 内容 |
| --- | --- | --- |
| Secret | `SUPABASE_URL` | Supabase プロジェクトの URL |
| Secret | `SUPABASE_SERVICE_ROLE_KEY` | service_role キー（Vercel や `VITE_` には置かない） |
| Secret | `ANTHROPIC_API_KEY` | LLM 抽出用。未設定なら JSON-LD のみで動く |
| Variable | `ARTMARK_USER_AGENT` | 連絡先入りの UA。**ASCII のみ**（例: `ArtMarkBot/0.1 (+https://artmark-web.vercel.app; contact: you@example.com)`） |

**初回は手動で確認してから**:

1. Actions タブ → "Crawl exhibitions" → Run workflow。`dry_run`（既定オン）のまま実行して、取得結果と却下理由をログで確認する
2. 問題なければ `dry_run` をオフにして実行し、Supabase に入ることを確認する
3. 以降は定期実行に任せる

`only` に取得先の id（例: `mori`）を入れると、その館だけ実行します。
取得先は `sources.json` の `enabled: true` のものだけで、既定はすべて false です。
ETag と LLM 抽出結果は Actions のキャッシュに残り、変更のないページは取り直しません。

失敗すると GitHub から通知が届きます（robots.txt や規約による「スキップ」は失敗扱いにしません）。

---

## 4. URL から下書きを作る（入力補助）

主要館のサイトを実際に調べたところ、**schema.org の構造化データを出している館はほとんどありませんでした**
（東京国立近代美術館は JSON-LD がありますが `CollectionPage` だけで会期は入っておらず、
国立新美術館・森美術館は JSON-LD 自体がありません）。
つまり巡回取得の自動化は、現時点の日本ではあまり当てになりません。

そこで用意したのが `/exhibition/new` の「公式ページの URL から下書きを作る」です。
公式ページの URL を貼ると、サーバー側（`api/extract.js`）が1ページだけ取得して、
タイトル・会期・料金・画像を推測し、フォームに入れます。

これは**自動収集ではなく、人が1件ずつ登録するときの入力補助**です。
実行するのは人がボタンを押したときだけ、対象は1ページだけ、
結果は必ず人が確認してから保存します。規約上の位置づけが巡回取得とは異なります。

会期は次の表記に対応しています。

- `2026年4月1日（水）〜6月30日（火）`（終了側の年の省略に対応）
- `会期：2026年4月1日 ～ 2026年6月30日`
- `2026.4.1 – 6.30`
- `2026.12.20 - 2027.2.15`（年をまたぐ場合）

読み取れた確度は画面に出ます。`low` のときは会期を手で入れてください。

**紹介文は og:description がそのまま入ります。** 公式サイトの文章をそのまま保存せず、
ご自身の言葉に書き換えてください。

### 安全のための制限

ユーザーが任意の URL を渡せる仕組みなので、踏み台にされない防御を入れてあります。

- ログイン済みユーザーだけが使える（アクセストークンを検証）
- `localhost` / プライベート IP / クラウドのメタデータサーバー（169.254.169.254）は拒否
- リダイレクト先も毎回同じ検査をする（最大3回）
- 取得は 2MB・12秒で打ち切り、HTML 以外は拒否

---

## 5. ユーザー投稿

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

主要館を調べた結果を踏まえると、順序はこうなります。

1. **範囲を絞る** — 全国を薄く覆うより「東京の主要20館なら揃っている」状態を作る
2. **自分で入れる** — URL 貼り付けの下書き機能を使えば、1件1〜2分。50件で1〜2時間
3. **自分で使う** — 実際に展覧会を探して、行って、記録する。ここで価値があるか分かる
4. **人が来てから** 掲載依頼や提携の話をする

Wikidata の美術館300件は1コマンドで入りますが、**展覧会のない美術館が290件並ぶだけ**です。
空の棚が増えるより、絞った範囲が埋まっているほうが体験は良くなります。
美術館マスタの拡充は、展覧会が集まってきてからで構いません。

**「自分が観た展覧会がない」で離脱される**のが最大のリスクです。
網羅性が上がるまでは、エリアやジャンルを絞って「この範囲なら揃っている」
状態を作るほうが、全国を薄く覆うより体験が良くなります。
