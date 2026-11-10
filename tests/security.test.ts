import { describe, it, expect } from "vitest";
import { assertAdmin } from "@/lib/access";
import { assertOrigin, readJson } from "@/lib/http";
import { csvCell, csvRow } from "@/lib/csv";
import { rateIdentifier } from "@/lib/rate-limit";
import { cleanAttribution } from "@/lib/utm";
import { templateSchema, validMedia } from "@/lib/validation";
import { demoTemplates } from "@/lib/demo";
describe("権限と要求の境界", () => {
  it("未ログイン・一般アカウントを拒否し、許可した管理者だけを通す", () => {
    expect(() => assertAdmin(null, ["admin"])).toThrow("ログイン");
    expect(() => assertAdmin({ id: "other" }, ["admin"])).toThrow("権限");
    expect(assertAdmin({ id: "admin" }, ["admin"]).id).toBe("admin");
  });
  it("同一生成元以外とOriginなしの書き込みを拒否する", () => {
    for (const origin of [
      undefined,
      "https://evil.invalid",
      "https://motion.invalid.evil.invalid",
    ])
      expect(() =>
        assertOrigin(
          new Request("https://motion.invalid", {
            headers: origin ? { origin } : {},
          }),
          "https://motion.invalid",
        ),
      ).toThrow();
    expect(() =>
      assertOrigin(
        new Request("https://motion.invalid", {
          headers: { origin: "https://motion.invalid" },
        }),
        "https://motion.invalid",
      ),
    ).not.toThrow();
  });
  it("JSON以外を拒否する", async () => {
    await expect(
      readJson(
        new Request("http://localhost", { method: "POST", body: "email=test" }),
      ),
    ).rejects.toMatchObject({ status: 415 });
  });
});
describe("IPと識別子", () => {
  const secret = "test-only-".repeat(5);
  const prod = { vercel: true, development: false, now: 0 };
  it("Vercel管理ヘッダーだけを信用する", () => {
    expect(() =>
      rateIdentifier(
        new Headers({ "x-forwarded-for": "203.0.113.1" }),
        secret,
        prod,
      ),
    ).toThrow();
    expect(() =>
      rateIdentifier(
        new Headers({ "x-vercel-forwarded-for": "203.0.113.1, 203.0.113.2" }),
        secret,
        prod,
      ),
    ).toThrow();
    expect(() =>
      rateIdentifier(
        new Headers({ "x-vercel-forwarded-for": "203.0.113.1" }),
        secret,
        { ...prod, vercel: false },
      ),
    ).toThrow();
  });
  it("生IPを出さず、時間枠と用途ごとに異なる識別子を使う", () => {
    const h = new Headers({ "x-vercel-forwarded-for": "203.0.113.1" });
    const a = rateIdentifier(h, secret, prod);
    expect(a).not.toContain("203.0.113.1");
    expect(a).toMatch(/^waitlist:[a-f0-9]{64}$/);
    expect(rateIdentifier(h, secret, { ...prod, now: 900000 })).not.toBe(a);
    expect(rateIdentifier(h, secret, prod, "login")).not.toBe(a);
  });
});
describe("CSV", () => {
  it.each([
    "=1+1",
    "+SUM(A1)",
    "-1+1",
    "@SUM(A1)",
    "   =cmd()",
    "\t  =cmd()",
    "\u0000@cmd()",
    "\u0085+cmd()",
    "\u200B=cmd()",
    "\r\n=cmd()",
  ])("式として解釈される値を無害化する: %s", (value) => {
    expect(csvCell(value).startsWith("\"'")).toBe(true);
  });
  it("引用符・改行・カンマを引用し、通常の文字列は保持する", () => {
    expect(csvCell('山田,"太郎"\n次')).toBe('"山田,""太郎""\n次"');
    expect(csvRow(["普通", null])).toBe('"普通",""\r\n');
  });
});
describe("表示データの検証", () => {
  it("許可されたUTMだけを保持し、URL・メール・長すぎる値は捨てる", () => {
    expect(
      cleanAttribution(
        new URLSearchParams(
          "utm_source=instagram&utm_medium=social&email=a@example.com&token=secret&utm_campaign=a@example.com&utm_content=https://a.invalid",
        ),
      ),
    ).toEqual({ utm_source: "instagram", utm_medium: "social" });
    expect(
      cleanAttribution(new URLSearchParams({ utm_source: "a".repeat(101) })),
    ).toEqual({});
  });
  it("危険な素材URL・パスを拒否する", () => {
    for (const value of [
      "javascript:alert(1)",
      "//evil.invalid/a",
      "/demo/../secret.png",
      "/demo/a.svg?x=1",
      "https://user:pass@example.com/a",
    ])
      expect(validMedia(value)).toBe(false);
    expect(validMedia("/demo/runway-walk.svg")).toBe(true);
    expect(validMedia("https://example.com/preview.mp4")).toBe(true);
  });
  it("すべてのデモ素材は検証可能な見本データ", () => {
    for (const t of demoTemplates) {
      const {
        id: _id,
        created_at: _created,
        updated_at: _updated,
        ...input
      } = t;
      void _id;
      void _created;
      void _updated;
      expect(templateSchema.safeParse(input).success).toBe(true);
    }
  });
});
