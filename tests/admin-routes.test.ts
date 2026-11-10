import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  service: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("@/lib/env", () => ({
  configIssue: () => null,
  isDemo: () => false,
  siteUrl: () => "http://localhost:3000",
  serverEnv: () => ({ adminIds: ["allowed-admin"] }),
}));
vi.mock("@/lib/supabase/server", () => ({
  authClient: async () => ({
    auth: { getUser: mocks.getUser, signOut: mocks.signOut },
  }),
}));
vi.mock("@/lib/supabase/service", () => ({ serviceClient: mocks.service }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { requireAdmin } from "@/lib/auth";
import { GET as exportCsv } from "@/app/api/admin/subscribers/export/route";
import { POST as createTemplate } from "@/app/api/admin/templates/route";
import { PUT as editTemplate } from "@/app/api/admin/templates/[id]/route";
import { DELETE as deleteSubscriber } from "@/app/api/admin/subscribers/[id]/route";
import { POST as logout } from "@/app/api/admin/logout/route";
import AdminPage from "@/app/admin/page";
import TemplatesPage from "@/app/admin/templates/page";
import NewPage from "@/app/admin/templates/new/page";
import EditPage from "@/app/admin/templates/[id]/page";
import SubscribersPage from "@/app/admin/subscribers/page";
const url = "http://localhost:3000";
const context = {
  params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" }),
};
function request(method: string, path = "/api/admin/templates") {
  return new Request(url + path, {
    method,
    headers: { origin: url, "Content-Type": "application/json" },
    ...(method === "GET" ? {} : { body: "{}" }),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
});
describe("保護された出力・更新は本人と許可リストを確認してから特権接続する", () => {
  it.each([
    { user: null, status: 401 },
    { user: { id: "ordinary-user" }, status: 403 },
  ])("不許可ユーザー: $status", async ({ user, status }) => {
    mocks.getUser.mockResolvedValue({ data: { user }, error: null });
    const responses = await Promise.all([
      exportCsv(request("GET", "/api/admin/subscribers/export")),
      createTemplate(request("POST")),
      editTemplate(request("PUT"), context),
      deleteSubscriber(request("DELETE"), context),
      logout(request("POST")),
    ]);
    expect(responses.map((r) => r.status)).toEqual([
      status,
      status,
      status,
      status,
      status,
    ]);
    expect(mocks.service).not.toHaveBeenCalled();
  });
  it("管理ページも未ログイン・一般利用者を拒否し、データを取得しない", async () => {
    for (const user of [null, { id: "ordinary-user" }]) {
      mocks.getUser.mockResolvedValue({ data: { user }, error: null });
      for (const promise of [
        AdminPage(),
        TemplatesPage(),
        NewPage(),
        EditPage(context),
        SubscribersPage({ searchParams: Promise.resolve({}) }),
      ])
        await expect(promise).rejects.toThrow("NEXT_REDIRECT");
    }
    expect(mocks.service).not.toHaveBeenCalled();
  });
  it("本人確認に失敗したとき埋め込まれたユーザー情報を信用しない", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "allowed-admin" } },
      error: new Error("invalid token"),
    });
    await expect(requireAdmin()).rejects.toMatchObject({ status: 401 });
  });
  it("検証済みの許可管理者は通る", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "allowed-admin" } },
      error: null,
    });
    await expect(requireAdmin()).resolves.toEqual({ id: "allowed-admin" });
  });
  it("管理者のCSVは全対象の単一スナップショットを使う", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "allowed-admin" } },
      error: null,
    });
    const rpc = vi
      .fn()
      .mockResolvedValue({
        data: [{ email: "someone@example.com", utm_campaign: " =1+1" }],
        error: null,
      });
    mocks.service.mockReturnValue({ rpc });
    const response = await exportCsv(
      request("GET", "/api/admin/subscribers/export?page=2"),
    );
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("' =1+1");
    expect(rpc).toHaveBeenCalledWith("export_subscribers", {
      p_template: null,
      p_from: null,
      p_until: null,
    });
  });
});
