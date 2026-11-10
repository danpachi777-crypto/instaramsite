import { it, expect, vi } from "vitest";
const state = vi.hoisted(() => ({
  published: true,
  eq: vi.fn(),
  fetchOptions: undefined as undefined | RequestInit,
}));
vi.mock("@/lib/env", () => ({
  isDemo: () => false,
  publicEnv: () => ({
    url: "https://test.invalid",
    key: "test-only-placeholder",
  }),
  serverEnv: () => ({}),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: () => {
        const chain = {
          eq: (...args: unknown[]) => {
            state.eq(...args);
            return chain;
          },
          maybeSingle: async () => ({
            data: state.published
              ? { slug: "sample", title: "見本", is_published: true }
              : null,
            error: null,
          }),
        };
        return chain;
      },
    }),
  }),
}));
import { getPublicTemplate } from "@/lib/templates";
it("毎回公開状態で取得し、非公開にした詳細が古いアプリキャッシュから返らない", async () => {
  expect((await getPublicTemplate("sample"))?.title).toBe("見本");
  state.published = false;
  expect(await getPublicTemplate("sample")).toBeUndefined();
  expect(
    state.eq.mock.calls.filter((call) => call[0] === "is_published"),
  ).toEqual([
    ["is_published", true],
    ["is_published", true],
  ]);
  expect(state.eq).toHaveBeenCalledWith("slug", "sample");
});
