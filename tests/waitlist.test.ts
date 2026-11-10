import { describe, it, expect, vi } from "vitest";
import {
  registerWaitlist,
  CONSENT_VERSION,
  SUCCESS_MESSAGE,
  type Registration,
} from "@/lib/waitlist";
import { HttpError } from "@/lib/http";
function request(value: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(value),
  });
}
const valid = {
  email: " Test@Example.com ",
  consent: true,
  source: "hero",
  utm_campaign: "launch",
};
function deps() {
  return {
    limit: vi.fn(async () => {}),
    save: vi.fn(async (data: Registration) => {
      void data;
    }),
    now: () => new Date("2026-11-10T01:02:03Z"),
  };
}
describe("メール登録の窓口", () => {
  it("正規化したメール・サーバーの同意日時と版だけを保存する", async () => {
    const d = deps();
    const response = await registerWaitlist(request(valid), d);
    expect(await response.json()).toEqual({ message: SUCCESS_MESSAGE });
    expect(d.save).toHaveBeenCalledWith({
      email: "test@example.com",
      source: "hero",
      template_id: null,
      utm_campaign: "launch",
      consent_at: "2026-11-10T01:02:03.000Z",
      created_at: "2026-11-10T01:02:03.000Z",
      consent_version: CONSENT_VERSION,
    });
  });
  it.each([
    { email: "broken" },
    { consent: false },
    { consent: "true" },
    { source: "anything" },
    { consent_version: "forged" },
    { template_id: "bad" },
    { source: "template" },
    { utm_campaign: "a".repeat(101) },
    { email: "" },
  ])("不正な入力を拒否する: %j", async (patch) => {
    const d = deps();
    await expect(
      registerWaitlist(request({ ...valid, ...patch }), d),
    ).rejects.toMatchObject({ status: 400 });
    expect(d.save).not.toHaveBeenCalled();
  });
  it("壊れたJSONを拒否する", async () => {
    const r = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    await expect(registerWaitlist(r, deps())).rejects.toMatchObject({
      status: 400,
    });
  });
  it("宣言サイズに頼らず、実際のストリーム長にも上限を設ける", async () => {
    await expect(
      registerWaitlist(request({ ...valid, extra: "a".repeat(5000) }), deps()),
    ).rejects.toMatchObject({ status: 413 });
    await expect(
      registerWaitlist(request(valid, { "Content-Length": "9000" }), deps()),
    ).rejects.toMatchObject({ status: 413 });
  });
  it("隠し入力欄に値がある場合は保存しない", async () => {
    const d = deps();
    await expect(
      registerWaitlist(request({ ...valid, website: "spam" }), d),
    ).rejects.toMatchObject({ status: 400 });
    expect(d.save).not.toHaveBeenCalled();
  });
  it("回数制限が失敗・上限到達なら保存しない", async () => {
    const d = deps();
    d.limit.mockRejectedValue(new HttpError(429, "送信回数が多すぎます。"));
    await expect(registerWaitlist(request(valid), d)).rejects.toMatchObject({
      status: 429,
    });
    expect(d.save).not.toHaveBeenCalled();
  });
  it("存在しない・非公開テンプレートは保存側の原子的な検証で拒否する", async () => {
    const d = deps();
    d.save.mockRejectedValue(new HttpError(400, "非公開"));
    await expect(
      registerWaitlist(
        request({
          ...valid,
          template_id: "00000000-0000-4000-8000-000000000001",
        }),
        d,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("重複した場合も新規と同じ成功応答になり、登録者の情報を返さない", async () => {
    const d = deps();
    const responses = await Promise.all([
      registerWaitlist(request(valid), d),
      registerWaitlist(request(valid), d),
    ]);
    const bodies = await Promise.all(responses.map((r) => r.json()));
    expect(bodies).toEqual([
      { message: SUCCESS_MESSAGE },
      { message: SUCCESS_MESSAGE },
    ]);
  });
  it("実際の保存失敗を成功扱いしない", async () => {
    const d = deps();
    d.save.mockRejectedValue(new Error("database unavailable"));
    await expect(registerWaitlist(request(valid), d)).rejects.toThrow(
      "database unavailable",
    );
  });
});
