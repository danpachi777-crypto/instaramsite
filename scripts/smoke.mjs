import assert from "node:assert/strict";
const base = new URL(process.env.MOTION_SMOKE_URL || "http://localhost:3000");
if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname))
  throw new Error("この確認はローカルのデモ専用です。");
async function check(path, status, text) {
  const response = await fetch(new URL(path, base), { redirect: "manual" });
  assert.equal(response.status, status, `${path}: status`);
  const html = await response.text();
  if (text) assert.ok(html.includes(text), `${path}: content`);
  console.log(`成功 ${status} ${path}`);
}
await check("/", 200, "デモ表示中：メール登録は利用できません");
await check("/templates", 200, "ランウェイウォーク");
await check("/templates?category=effects", 200, "不思議な物体の回転");
await check(
  "/templates?category=unknown",
  200,
  "該当するテンプレートはありません",
);
await check("/templates/runway-walk", 200, "プレビュー準備中");
await check("/templates/does-not-exist", 404, "ページが見つかりません");
await check("/privacy", 200, "未設定");
await check("/terms", 200, "下書き");
await check("/admin/login", 200, "デモ表示中は管理画面を利用できません");
for (const path of [
  "/admin",
  "/admin/templates",
  "/admin/templates/new",
  "/admin/subscribers",
])
  await check(path, 307);
await check("/api/admin/subscribers/export", 403, "管理者権限");
const result = await fetch(new URL("/api/waitlist", base), {
  method: "POST",
  headers: { origin: base.origin, "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "smoke@example.invalid",
    consent: true,
    source: "hero",
  }),
});
assert.equal(result.status, 503);
assert.deepEqual(await result.json(), {
  message: "デモ表示中：メール登録は利用できません",
});
console.log("成功 503 /api/waitlist（デモでは保存・成功表示なし）");
