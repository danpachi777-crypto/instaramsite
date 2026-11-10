// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WaitlistForm } from "@/components/waitlist-form";
import { SUCCESS_MESSAGE } from "@/lib/waitlist";
vi.mock("@/components/attribution", () => ({
  getAttribution: () => ({ utm_source: "instagram" }),
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const consentLabel =
  "MOTIONの先行案内とサービス更新情報をメールで受け取ることに同意します。配信はいつでも停止できます。";
describe("登録フォームの状態とアクセシビリティ", () => {
  it("同意は未選択で必須。デモは送信できない", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    render(<WaitlistForm demo />);
    const checkbox = screen.getByLabelText(consentLabel) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    expect(checkbox.required).toBe(true);
    expect(checkbox.matches(":disabled")).toBe(true);
    expect(
      (screen.getByRole("button") as HTMLButtonElement).matches(":disabled"),
    ).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("送信中は連打を防ぎ、保存後の日本語受付結果を読み上げる", async () => {
    let resolve!: (value: Response) => void;
    const fetch = vi.fn<typeof globalThis.fetch>(
      () =>
        new Promise<Response>((r) => {
          resolve = r;
        }),
    );
    vi.stubGlobal("fetch", fetch);
    render(
      <WaitlistForm
        demo={false}
        source="template"
        templateId="00000000-0000-4000-8000-000000000001"
      />,
    );
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/メールアドレス/),
      "test@example.com",
    );
    await user.click(screen.getByLabelText(consentLabel));
    const form = screen.getByRole("button").closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button").matches(":disabled")).toBe(true);
    expect(screen.getByRole("status").textContent).toContain("送信しています");
    const body = JSON.parse(fetch.mock.calls[0][1]!.body as string);
    expect(body.template_id).toBe("00000000-0000-4000-8000-000000000001");
    expect(body.utm_source).toBe("instagram");
    resolve(Response.json({ message: SUCCESS_MESSAGE }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain(SUCCESS_MESSAGE),
    );
    expect(screen.queryByText("確認メールを送信しました")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("保存失敗は成功表示せず、入力を維持して再試行できる", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          { message: "時間をおいてお試しください。" },
          { status: 503 },
        ),
      )
      .mockResolvedValueOnce(Response.json({ message: SUCCESS_MESSAGE }));
    vi.stubGlobal("fetch", fetch);
    render(<WaitlistForm demo={false} />);
    const user = userEvent.setup();
    const email = screen.getByLabelText(/メールアドレス/) as HTMLInputElement;
    await user.type(email, "test@example.com");
    await user.click(screen.getByLabelText(consentLabel));
    await user.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain("時間をおいて"),
    );
    expect(email.value).toBe("test@example.com");
    expect(screen.getByRole("button").textContent).toContain("もう一度");
    await user.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain(SUCCESS_MESSAGE),
    );
  });
});
