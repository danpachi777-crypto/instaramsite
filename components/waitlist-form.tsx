"use client";
import { useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { getAttribution } from "@/components/attribution";
import { clientApi } from "@/lib/client-api";
import { SUCCESS_MESSAGE } from "@/lib/waitlist";
export function WaitlistForm({
  demo,
  templateId,
  source = "footer",
}: {
  demo: boolean;
  templateId?: string;
  source?: "hero" | "footer" | "template";
}) {
  const id = useId();
  const lock = useRef(false);
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || demo) return;
    lock.current = true;
    setStatus("sending");
    setMessage("お申し込みを送信しています。");
    const form = new FormData(event.currentTarget);
    try {
      await clientApi("/api/waitlist", "POST", {
        email: form.get("email"),
        consent: form.get("consent") === "on",
        website: form.get("website"),
        template_id: templateId ?? null,
        source,
        ...getAttribution(),
      });
      setStatus("success");
      setMessage(SUCCESS_MESSAGE);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error && error.message !== "Failed to fetch"
          ? error.message
          : "通信できませんでした。接続を確認して、もう一度お試しください。",
      );
    } finally {
      lock.current = false;
    }
  }
  return (
    <div className="signup-form">
      {demo ? (
        <p className="notice">デモ表示中：メール登録は利用できません</p>
      ) : null}
      {status !== "success" && (
        <form onSubmit={submit} aria-busy={status === "sending"}>
          <fieldset disabled={demo || status === "sending"}>
            <label htmlFor={`${id}-email`}>
              メールアドレス <span className="required">必須</span>
            </label>
            <p id={`${id}-help`} className="field-help">
              先行案内とサービスの更新情報をお届けするために使います。
            </p>
            <input
              id={`${id}-email`}
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              aria-describedby={`${id}-help ${id}-result`}
            />
            <div className="honeypot" aria-hidden="true">
              <label htmlFor={`${id}-website`}>
                この欄には入力しないでください
              </label>
              <input
                id={`${id}-website`}
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                maxLength={200}
              />
            </div>
            <label className="check-label" htmlFor={`${id}-consent`}>
              <input
                id={`${id}-consent`}
                name="consent"
                type="checkbox"
                required
              />
              <span>
                MOTIONの先行案内とサービス更新情報をメールで受け取ることに同意します。配信はいつでも停止できます。
              </span>
            </label>
            <p className="field-help">
              <Link href="/privacy">プライバシーポリシー</Link>
              をご確認ください。
            </p>
            <button className="button primary full" type="submit">
              {status === "sending"
                ? "送信しています…"
                : status === "error"
                  ? "もう一度申し込む"
                  : "先行案内に登録する"}
              <span aria-hidden="true">↗</span>
            </button>
          </fieldset>
        </form>
      )}
      <div
        id={`${id}-result`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`form-result ${status}`}
      >
        {status === "success" && (
          <span className="success-icon" aria-hidden="true">
            ✓
          </span>
        )}
        {message}
      </div>
    </div>
  );
}
