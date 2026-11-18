"use client";
import { useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { IdeaCta } from "./idea-cta";
import { getAttribution } from "@/components/attribution";
import { clientApi } from "@/lib/client-api";
import { SUCCESS_MESSAGE } from "@/lib/waitlist";
import { useI18n } from "./i18n";
import { formText, type formKeys } from "@/lib/i18n";
export function WaitlistForm({
  demo,
  templateId,
  source = "footer",
  legacy = false,
}: {
  demo: boolean;
  templateId?: string;
  source?: "hero" | "footer" | "template";
  legacy?: boolean;
}) {
  const id = useId();
  const { locale: selectedLocale, t } = useI18n();
  const locale = legacy ? "ja" : selectedLocale;
  const f = (key: typeof formKeys[number]) => formText(locale, key);
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
    setMessage(f("sending"));
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
      setMessage(locale === "ja" ? SUCCESS_MESSAGE : f("success"));
    } catch (error) {
      setStatus("error");
      setMessage(
        locale === "ja" && error instanceof Error && error.message !== "Failed to fetch"
          ? error.message
          : f("error"),
      );
    } finally {
      lock.current = false;
    }
  }
  return (
    <div className="signup-form">
      {demo ? (
        legacy ? <p className="notice">デモ表示中：メール登録は利用できません</p> : <div className="demo-registration-notice"><p className="notice">{t("earlyPreparing")}<br />{t("unavailable")}</p><IdeaCta href="/templates">{t("viewIdeas")}</IdeaCta></div>
      ) : null}
      {(!demo || legacy) && status !== "success" && (
        <form onSubmit={submit} aria-busy={status === "sending"}>
          <fieldset disabled={demo || status === "sending"}>
            <label htmlFor={`${id}-email`}>
              {f("email")} <span className="required">{f("required")}</span>
            </label>
            <p id={`${id}-help`} className="field-help">
              {locale === "ja" ? "先行案内とサービスの更新情報をお届けするために使います。" : t("earlyDescription")}
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
                {f("consent")}
              </span>
            </label>
            <p className="field-help">
              <Link href="/privacy">{legacy ? "プライバシーポリシー" : t("privacy")}</Link>
              {locale === "ja" ? "をご確認ください。" : ""}
            </p>
            <button className="button primary full" type="submit">
              {status === "sending"
                ? f("sending")
                : status === "error"
                  ? f("retry")
                  : f("submit")}
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
