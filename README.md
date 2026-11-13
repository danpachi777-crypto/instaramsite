# MOTION — AI動画テンプレートサイト

現行UIには近未来デザイン案「01 · イオンブルー」の深い青とシアンの配色を適用しています。10案のローカル比較は `public/design/futuristic-current-ui-10.html` で確認できます（埋め込み表示には `python3 design/serve-futuristic-preview.py` を使用）。

Instagramから訪れた人が動画のスタイルを探し、テンプレートをお気に入りに保存できるMVPです。公開画面、管理画面、SQL、初期データ、検証を実装しています。動画作成機能は準備中です。外部公開・Supabaseプロジェクトの作成や接続設定はまだ行っていません。

**動画生成・決済・一般利用者アカウント・アップロード・自動メール送信は実装していません。** 元の要件全文は [仕様書](docs/SPECIFICATION.md)、保守上の指示は [CODEX_PROMPT.md](CODEX_PROMPT.md) に保存しています。

## 実装した機能

- `/`：左右の矢印で切り替えるテンプレートプレビューと言語選択。
- `/templates`：動物・スポーツを含む7カテゴリーの絞り込み、選択状態、該当なし・解除。
- `/templates/[slug]`：公開された詳細、縦横比、作例、動画作成ボタン。下書き・存在しないURLは404。
- `/favorites`・`/settings`：お気に入りの再表示・削除。
- `/privacy`・`/terms`：運営者が確認・追記する項目を明示した下書き。
- `/admin/login`：手動作成したSupabase Authアカウントのログイン。
- `/admin`：件数と最近の登録。
- `/admin/templates`・`/new`・`/[id]`：作成・編集・表示順・公開状態の変更。
- `/admin/subscribers`：25件ずつの一覧、テンプレート・登録日による絞り込み、全対象CSV、個別の削除確認。
- `POST /api/waitlist`：旧登録API。現在は410を返し、新規登録を受け付けません。

## 構成と前提

Node.js **24.x LTS**（`.nvmrc`）、npm。Next.js 16.4.6 App Router、React 19.3.1、TypeScript、Tailwind CSS 4、Supabase JS / SSR、Zod。正確な依存関係は `package.json` と `package-lock.json` に固定しています。外部フォントや解析タグは読み込みません。

```text
app/                    公開画面・管理画面・API・メタデータ
components/             フォーム・プレビュー・共通画面
lib/                    検証・認証・環境設定・DB接続・CSV・UTM
proxy.ts                管理ルートの認証クッキー更新（権限判定は各処理）
public/demo/            ImageGenによる静止画11点・従来の仮画像・無音用字幕
supabase/migrations/    履歴管理された構造変更
supabase/seed.sql       編集を上書きしない初期の非公開下書き9種類
supabase/maintenance.sql 回数制限記録を削除する定期処理
supabase/tests/         DBの権限とRLSを確認するSQL
scripts/test-db.mjs     実DBでの結合・同時実行テスト
tests/                 単体・API境界・PostgreSQLエンジンのテスト
docs/                  原仕様・検証結果と引き渡し手順
```

## 手元でデモを起動する

```sh
cd /Users/itoutoranosuke/instaramsite
nvm install
nvm use
npm ci
cp .env.example .env.local
```

`.env.local` の `DEMO_MODE=true` を設定します。`NEXT_PUBLIC_SITE_URL=http://localhost:3000` のままで起動できます。

```sh
npm run dev
```

`http://localhost:3000` を開くと、動物・スポーツを含む11種類の独立した見本を閲覧できます。デモでは管理操作は無効です。本番の下書きデータを公開する機能ではありません。

```sh
npm run build
npm start
```

デモの本番ビルドも可能です。通常モードでも外部データをビルド時に取得せず、実行時に設定とデータを確認します。未設定を勝手にデモへ切り替えることはありません。

## 環境変数

`.env.local` はGit管理外です。Vercelでは環境ごとに設定し、変更後に再デプロイします。`NEXT_PUBLIC_*` はビルド時に固定されるため、正式URLや公開キーの変更後は本番ビルドも作り直してください。

| 変数 | 区分 | 内容 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 公開可 | パスを含まない正式な生成元URL。ローカルは `http://localhost:3000`、公開時はHTTPS。Origin照合と共有情報にも使用 |
| `NEXT_PUBLIC_SUPABASE_URL` | 公開可 | SupabaseプロジェクトのURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 公開可 | プロジェクトの公開匿名キー。RLSを適用して使用 |
| `SUPABASE_SERVICE_ROLE_KEY` | **サーバー専用** | 同じプロジェクトのサービスロールキー。ブラウザー・ログへ出さない |
| `ADMIN_USER_IDS` | **サーバー専用** | 許可するAuthユーザーUUIDのカンマ区切り。空欄不可 |
| `RATE_LIMIT_HMAC_SECRET` | **サーバー専用** | 32文字以上のランダム値。環境ごとに異なる値を用意 |
| `DEMO_MODE` | サーバー専用 | 明示的な `true` だけがデモ。通常は `false` |
| `TEST_DATABASE_URL` | 検証専用の秘密値 | 任意。結合テスト用のPostgres管理接続文字列。本番デプロイには設定しない |
| `MOTION_DB_TEST_CONFIRM` | 検証実行時のみ | 破棄可能な検証DBであることを確認して `disposable` を指定 |

`VERCEL` と `NODE_ENV` は実行基盤が設定する値です。通常の運用で自分で書き換えないでください。秘密値は端末の秘密管理機能等で生成し、ソースに貼らないでください。設定不足時は必要な変数名だけを日本語で表示し、値は表示しません。`lib/env.ts` に検証を集約しています。

## Supabaseの準備と構造変更

前提：運営者のSupabaseプロジェクト、Postgresの管理接続（Dashboard「Connect」で取得）、`psql` が必要です。`anon`・`authenticated`・`service_role` はSupabaseが用意するロールです。通常のPostgresへそのまま流す手順ではありません。

プロジェクトの秘密管理機能で `DATABASE_URL` を管理接続文字列として設定します（`.env.example` のアプリ変数とは別の、DB作業用シェル変数です）。パスワードをコマンドの履歴やGitへ書き込まないでください。

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20261110000000_initial.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql
```

構造変更は一度だけ適用します。既存環境で初期構造変更を再実行しないでください。初期構造変更の後に `supabase/migrations/20261113000000_animal_sports_categories.sql` と `supabase/migrations/20261113000001_generated_posters.sql` を順に適用してください。前者は動物・スポーツの分類と下書き2件を追加します。後者は既定のSVG画像を使っている行だけ生成JPEGへ切り替え、独自に設定した画像や公開状態は維持します。seedと動物・スポーツの追加SQLは `slug` の競合時に既存行を変更しません。新しい行は非公開で登録されます。

Supabase CLIで管理する場合は、CLIを公式手順で導入して `supabase init`・`supabase link --project-ref <PROJECT_REF>` を行い、`supabase db push` でマイグレーションを適用できます。上のpsql適用と混在させず、採用した方法の履歴を管理してください。seedとmaintenanceは上記psqlで適用できます。

DashboardのDatabase → Extensionsで `pg_cron` を有効にし、次を実行してください。

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/maintenance.sql
```

この処理は `motion-clean-rate-limits` を5分間隔で登録し、再実行時は同名ジョブを置き換えます。公開前に `cron.job` と `cron.job_run_details` で実行成功を確認してください。新規リクエスト時にも期限切れ記録を削除しますが、無通信時の削除には定期処理が必要です。アプリはサービスロールだけで掃除用テーブルを直接操作できません。

## データのアクセス規則

- `templates` はRLSで公開済みだけを `anon`・`authenticated` にSELECT許可。これらのロールに作成・更新・削除権限はありません。
- `subscribers` はRLS有効・公開ポリシーなし。`anon`・`authenticated` から全操作を明示的に剥奪しています。
- `private.rate_limits` は非公開スキーマ内、RLS有効。公開用権限にテーブル・スキーマ権限を与えません。
- 登録・回数制限・CSVの特権関数は `search_path=''`、参照先を完全修飾し、`PUBLIC`・`anon`・`authenticated` から実行権限を剥奪。`service_role` だけが呼べます。
- アプリの特権クライアントは `server-only`。管理ページ・各APIはSupabase `getUser()` で本人を確認した後、許可リストと照合してから使用します。クッキーの未検証ユーザーや `getSession()` だけを信用しません。
- 登録関数内で公開テンプレートを共有ロックしてからINSERT。メール正規化はDBトリガーでも強制し、一意制約と `ON CONFLICT DO NOTHING` で初回を維持します。同意日時と登録日時もDBサーバーで記録します。

詳細と検証方法は [検証資料](docs/VERIFICATION.md) を参照してください。

## 管理者アカウント

1. Supabase Dashboard → Authentication → Users → Add userで、管理者のメール・十分な強度のパスワードを手動登録します。招待メールの送信機能は本アプリでは使いません。
2. Authentication設定で一般向けの新規登録・匿名ログインを無効にします。許可リスト確認は、新規登録の設定にかかわらず必須です。
3. Users画面のユーザーUUIDを `ADMIN_USER_IDS` に設定します。複数人はカンマ区切りです。
4. `DEMO_MODE=false` と実際のSupabase設定を保存し、再起動します。
5. `/admin/login` へアクセスします。公開サインアップ・パスワード再設定画面はありません。再設定は運営者がSupabase側で行います。

AuthクッキーはSSRライブラリーと `proxy.ts` で更新します。HttpOnly・SameSite=Lax、productionではSecureです。管理画面は共有キャッシュに保存しません。書き込みAPIは設定したURLとの厳密なOrigin照合を行い、クロスサイト要求やOriginなしを拒否します。ログイン後の移動先は固定の `/admin` です。

## 素材の差し替えと公開

`/admin/templates` から対象を編集し、動画・ポスターURL、短い説明と想定用途、カテゴリー、縦横比、表示順を設定します。動画は**利用権があり、音声に依存しない無音の作例**を使ってください。音声を必要とする作例向けの字幕アップロード機能はありません。

HTTPS URLまたは `/demo/` 内の許可拡張子のパスを受け付けます。URLの実在・権利・通信速度・MIME型は管理者が確認してください。動画にはポスター画像を必須としています。動画は `preload="none"`・`playsInline`・`muted`・再生操作付きです。自動再生しません。再生失敗時はポスターと案内へ切り替えます。

素材未指定でも整った「プレビュー準備中」を表示します。同梱SVGは独自の仮素材であり、生成動画ではありません。確認後に公開チェックを入れて保存してください。公開ページは常に動的取得・`no-store`、更新時に関連パスを再検証します。非公開後の次回のサーバー取得は404になります。すでに表示した利用者の画面や保存済み画像まで遠隔消去するものではありません。

## 登録・回数制限・CSV

登録フォームは未選択の同意チェックを必須にし、登録場所・対象UUID・許可したUTMだけを送ります。メールはtrim・小文字化し、Gmail等に依存したドット除去はしません。成功メッセージは新規・既存で共通です。登録者ID・登録有無は返しません。送信失敗は再試行可能で、入力を残します。自動メール送信はありません。

回数制限は `private.rate_limits` と原子的なINSERT/UPDATE関数を使用します。Vercelの複数インスタンスでも共通です。**Vercelのエッジが設定する `x-vercel-forwarded-for`** の単一IPだけを採用し、任意の `x-forwarded-for` は使いません。`VERCEL=1` 以外の本番サーバーでは保存を安全に停止します。Vercel以外へ移す場合は、その基盤の信頼できる送信元取得方式を実装・検証してください。公開時はVercelに直接接続し、独自の前段プロキシ構成は別途検証してください。

IPは保存・アプリログ出力せず、秘密値で15分の時間枠と用途を組み合わせたHMACへ変換します。登録は1時間枠5回、ログインは10回です（固定枠の境界付近では隣接枠の回数が許容されます）。識別子は最長30分で期限切れ、5分ごとの掃除で削除します。開発サーバーだけは全要求を同じローカル識別子にまとめます。ローカルで `npm start` を使う通常モードでは、Vercelの信頼情報がないため送信を停止します。保存の手元確認は `npm run dev` で行ってください。

UTMは4項目、各100文字以内の文字・数字・空白・`_`・`.`・`-` に限定し、メールやURL形の値は保存しません。タブのセッション中に初回の有効値を保持します。保存機能が無効でもメモリー内で保持し、登録自体を壊しません。外部の追跡サービスは不要です。

CSVは絞り込みに合う全ページを単一SQLのスナップショットで取得します。最大10,000件、10,001件以上は出力を断り日付の分割を案内します。Supabaseの通常の行取得上限に依存しないJSON集約関数を使用しています。BOM付きUTF-8、全セル引用、引用符のエスケープに加え、先頭の空白・制御文字の後も含めて数式文字を無害化します。CSVは個人情報として必要な人だけが扱い、不要になったら適切に削除してください。

## 運営者が公開前に確定すること

- `/privacy`・`/terms` の【未設定】【公開前に確定】を実在する内容に置換：運営者名、会社情報・所在地、問い合わせ窓口、保存期間、適用日、運営形態に応じた規約条項。
- 受信して対応できる窓口を用意し、本人確認・手動の配信停止・個別削除の担当と手順を決めます。停止依頼では今後の案内対象から外し、不要な個人情報を管理画面で削除します。再登録の抑止リストは本MVPにはないため、停止後の再登録があれば新規の同意として扱います。
- 保存期間を決め、期限を過ぎたデータを削除する定期運用を決めます。本MVPは登録者の自動一括削除機能を持ちません。
- Supabase・Vercelのリージョン、ログ保存、保管場所、委託先条件を確認して方針に反映します。文面の適法性を保証するものではありません。
- 素材の利用許諾と実URLを確認し、下書きから公開します。

## GitHubからVercelへ公開する手順（未実施）

1. このリポジトリーをVercelへImport。FrameworkをNext.js、Node.jsを24.x、Install `npm ci`、Build `npm run build` に設定します。`vercel.json` でもFramework等を指定しています。
2. Development / Preview / Productionで別のSupabaseプロジェクトを用意するなど、検証データと本番データを分けます。実キーはVercelの環境変数管理にだけ登録します。
3. 対象DBに構造変更、seed、定期削除を適用します。管理者を手動作成し許可リストを設定します。
4. `NEXT_PUBLIC_SITE_URL` をその環境の正式なHTTPS生成元URLに設定します。Previewも固定した確認用ドメイン等を設定し、実際にアクセスする生成元と一致させます。未設定の一時URLや別ホストからの書き込みはOrigin照合で拒否します。末尾パス・検索パラメーターは付けません。
5. Supabase Authentication → URL ConfigurationでSite URLを同じ正式URLにし、必要なRedirect URLsだけを登録します。本アプリのパスワードログインは外部リダイレクトを使いません。ワイルドカードの許可は不要です。
6. `DEMO_MODE=false` とすべての必須設定を確認しデプロイ。Vercelによる要求元ヘッダーの付与、回数制限、cronの成功を確認します。
7. [結合・ブラウザー確認手順](docs/VERIFICATION.md) を実施。利用規約、問い合わせ窓口、保存期間、素材の確認後にInstagramから案内します。

Instagramリンク例：`https://YOUR_DOMAIN/templates?utm_source=instagram&utm_medium=social&utm_campaign=launch`。メールアドレスや秘密情報をURLへ入れないでください。

## 検証コマンドと現在の状況

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm audit
# 起動中のローカルデモに対するHTTP確認
npm run test:smoke
```

`npm test` はVitestの境界テストと、PGliteの実PostgreSQLエンジンでのSQL・ロール権限・RLSの検証を実行します。PGliteはSupabaseサーバーそのものではなく、Auth・PostgREST・ネットワーク・複数接続の検証にはなりません。

実Supabaseの検証は、構造変更済みの**破棄可能な専用プロジェクト**の管理接続を `TEST_DATABASE_URL` に設定してから実行します。

```sh
MOTION_DB_TEST_CONFIRM=disposable npm run test:db
```

実DBテストは専用の検証データだけを作成・削除します。権限確認SQLはトランザクションをロールバックします。本番DBでは実行しないでください。接続未設定なら終了コード2で未実行を報告します。

実際の検査結果と未検証項目は [docs/VERIFICATION.md](docs/VERIFICATION.md) に記載します。接続情報がないため実Supabaseへの保存・Auth・Vercel公開・Instagram実機は未検証です。

## 参照した公式資料

- [Next.jsの導入・要件](https://nextjs.org/docs/app/getting-started/installation)
- [SupabaseのSSR認証](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Vercelの要求ヘッダー](https://vercel.com/docs/headers/request-headers)
- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
