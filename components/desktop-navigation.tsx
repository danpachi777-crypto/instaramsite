"use client";

import { useRef } from "react";
import Link from "next/link";

export function DesktopNavigation({ demo = false }: { demo?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        className="desktop-menu-trigger"
        aria-label="メニューを開く"
        onClick={() => dialog.current?.showModal()}
      >
        <span />
        <span />
        <span />
      </button>
      <dialog
        ref={dialog}
        className="desktop-navigation-dialog"
        data-lenis-prevent
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="desktop-navigation-top">
          <span>MOTION</span>
          <button
            type="button"
            aria-label="メニューを閉じる"
            onClick={() => dialog.current?.close()}
          >
            閉じる ×
          </button>
        </div>
        <div className="desktop-navigation-columns">
          {[
            {
              title: "STYLES",
              links: [
                ["動画作例", "/templates"],
                ["ファッション", "/templates?category=fashion"],
                ["商品紹介", "/templates?category=product"],
                ["ライフスタイル", "/templates?category=lifestyle"],
                ["映画風", "/templates?category=cinematic"],
                ["特殊効果", "/templates?category=effects"],
              ],
            },
            {
              title: "MOTION",
              links: [
                ["スタイルを探す", "/#styles"],
                ["使い方", "/#how"],
                [demo ? "先行案内は準備中" : "先行案内", "/#waitlist"],
              ],
            },
            {
              title: "INFORMATION",
              links: [
                ["プライバシーポリシー", "/privacy"],
                ["利用規約", "/terms"],
                ["お問い合わせ", "/privacy#contact"],
              ],
            },
          ].map((group) => (
            <div key={group.title}>
              <span>{group.title}</span>
              {group.links.map(([title, href]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => dialog.current?.close()}
                >
                  {title} +
                </Link>
              ))}
            </div>
          ))}
        </div>
      </dialog>
    </>
  );
}
