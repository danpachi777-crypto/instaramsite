"use client";
/* eslint-disable @next/next/no-img-element -- 管理者指定の任意HTTPS素材に対応し、動画も操作時だけ取得する。 */
import { useState } from "react";
import type { Template } from "@/lib/validation";
import { useI18n } from "./i18n";
import { formText, ideaTitle } from "@/lib/i18n";
export function Preview({
  template,
  eager = false,
  legacy = false,
}: {
  template: Pick<
    Template,
    "title" | "preview_url" | "poster_url" | "aspect_ratio"
  > & { slug?: string };
  eager?: boolean;
  legacy?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const { t, locale } = useI18n();
  const title = !legacy && template.slug ? ideaTitle(locale, template.slug, template.title) : template.title;
  const [posterFailed, setPosterFailed] = useState(false);
  const available = !!template.preview_url && !failed;
  return (
    <div
      className="preview"
      style={{ aspectRatio: template.aspect_ratio.replace(":", "/") }}
    >
      {available ? (
        <video
          controls
          playsInline
          muted
          preload="none"
          poster={template.poster_url || undefined}
          controlsList="nodownload"
          onError={() => setFailed(true)}
          aria-label={legacy ? `${title}の動画作例` : `${title} — ${t("viewIdeas")}`}
        >
          <source src={template.preview_url} />
          <track
            kind="captions"
            src="/demo/silent.vtt"
            srcLang="ja"
            label={legacy ? "無音の作例" : t("viewIdeas")}
            default
          />
          {formText(legacy ? "ja" : locale, "unsupportedVideo")}
        </video>
      ) : (
        <>
          {template.poster_url && !posterFailed ? (
            <img
              src={template.poster_url}
              alt={legacy ? `${title}の仮のイメージ` : `${title} — ${t("preparing")}`}
              width={400}
              height={650}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              onError={() => setPosterFailed(true)}
            />
          ) : (
            <div className="abstract-poster">
              <span aria-hidden="true">M</span>
            </div>
          )}
          <span className="preview-label">
            {failed ? formText(legacy ? "ja" : locale, "videoError") : legacy ? "プレビュー準備中" : t("preparing")}
          </span>
        </>
      )}
      <span className="ratio-label">{template.aspect_ratio}</span>
    </div>
  );
}
