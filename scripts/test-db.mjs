import pg from "pg";
import { readFile } from "node:fs/promises";
import { randomUUID, randomBytes } from "node:crypto";
import assert from "node:assert/strict";
if (
  !process.env.TEST_DATABASE_URL ||
  process.env.MOTION_DB_TEST_CONFIRM !== "disposable"
) {
  console.error(
    "未実行：検証専用DBの TEST_DATABASE_URL と MOTION_DB_TEST_CONFIRM=disposable が必要です。本番DBでは実行しないでください。",
  );
  process.exit(2);
}
const pool = new pg.Pool({
  connectionString: process.env.TEST_DATABASE_URL,
  max: 12,
});
let templateId;
const email = `motion-concurrency-${randomUUID()}@example.invalid`;
const key = `waitlist:${randomBytes(32).toString("hex")}`;
try {
  // This script requires already-applied migrations. It never resets a database.
  const client = await pool.connect();
  try {
    await client.query(
      await readFile(
        new URL("../supabase/tests/access.sql", import.meta.url),
        "utf8",
      ),
    );
  } finally {
    try {
      await client.query("rollback");
    } catch {}
    client.release();
  }
  const { rows } = await pool.query(
    "insert into public.templates(slug,title,description,category,is_published) values($1,'同時実行テスト','テスト専用','effects',true) returning id",
    [`test-${randomUUID()}`],
  );
  templateId = rows[0].id;
  const first = {
    email,
    source: "template",
    template_id: templateId,
    utm_source: "first",
    consent_version: "test-first",
  };
  await pool.query("select public.register_subscriber($1::jsonb)", [
    JSON.stringify(first),
  ]);
  await Promise.all(
    Array.from({ length: 10 }, () =>
      pool.query("select public.register_subscriber($1::jsonb)", [
        JSON.stringify({
          ...first,
          source: "footer",
          utm_source: "later",
          consent_version: "test-later",
        }),
      ]),
    ),
  );
  const saved = await pool.query(
    "select * from public.subscribers where email=$1",
    [email],
  );
  assert.equal(saved.rows.length, 1);
  assert.equal(saved.rows[0].utm_source, "first");
  assert.equal(saved.rows[0].consent_version, "test-first");
  const limits = await Promise.all(
    Array.from({ length: 10 }, () =>
      pool.query("select public.consume_rate_limit($1,5) as allowed", [key]),
    ),
  );
  assert.equal(limits.filter((r) => r.rows[0].allowed).length, 5);
  console.log(
    "成功：実DBの権限・RLS・公開状態・重複保護・同時登録・原子的回数制限を確認しました。",
  );
} catch {
  console.error(
    "失敗：実DB検証が完了しませんでした。接続設定とSQLを検証環境で確認してください。秘密情報を含む例外は表示していません。",
  );
  process.exitCode = 1;
} finally {
  // Only records created by this invocation are removed.
  try {
    await pool.query("delete from public.subscribers where email=$1", [email]);
    if (templateId)
      await pool.query("delete from public.templates where id=$1", [
        templateId,
      ]);
    await pool.query("delete from private.rate_limits where key=$1", [key]);
  } finally {
    await pool.end();
  }
}
