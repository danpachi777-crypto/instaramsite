import { it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
it("PostgreSQLエンジンで構造変更・初期データ・権限・RLS・重複保護・回数制限を検証する（Supabase接続試験は別）", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role bypassrls;",
    );
    await db.exec(
      await readFile("supabase/migrations/20261110000000_initial.sql", "utf8"),
    );
    await db.exec(await readFile("supabase/seed.sql", "utf8"));
    await db.exec(
      "update public.templates set title='編集済みの見本' where slug='runway-walk'",
    );
    await db.exec(await readFile("supabase/seed.sql", "utf8"));
    const { rows } = await db.query<{ count: number; all_drafts: boolean }>(
      "select count(*)::integer as count, bool_and(not is_published) as all_drafts from public.templates",
    );
    expect(rows[0]).toEqual({ count: 9, all_drafts: true });
    const edited = await db.query<{ title: string }>(
      "select title from public.templates where slug='runway-walk'",
    );
    expect(edited.rows[0].title).toBe("編集済みの見本");
    await db.exec(await readFile("supabase/tests/access.sql", "utf8"));
  } finally {
    await db.close();
  }
}, 30000);
