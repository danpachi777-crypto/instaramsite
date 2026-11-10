"use client";
/* eslint-disable @next/next/no-img-element -- 管理者指定の任意HTTPS素材に対応し、動画も操作時だけ取得する。 */
import { useState } from "react";
import type { Template } from "@/lib/validation";
export function Preview({
  template,
  eager = false,
}: {
  template: Pick<
    Template,
    "title" | "preview_url" | "poster_url" | "aspect_ratio"
  >;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
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
          aria-label={`${template.title}の無音の作例`}
        >
          <source src={template.preview_url} />
          <track
            kind="captions"
            src="/demo/silent.vtt"
            srcLang="ja"
            label="無音の作例"
            default
          />
          動画を再生できません。
        </video>
      ) : (
        <>
          {template.poster_url && !posterFailed ? (
            <img
              src={template.poster_url}
              alt={`${template.title}の仮のイメージ`}
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
            {failed ? "動画を読み込めませんでした" : "プレビュー準備中"}
          </span>
        </>
      )}
      <span className="ratio-label">{template.aspect_ratio}</span>
    </div>
  );
}
