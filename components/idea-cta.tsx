import type { ReactNode } from "react";
import Link from "next/link";

export function IdeaCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="button primary idea-cta" href={href}>
      <span className="idea-cta-label">{children}</span>
      <svg className="idea-cta-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
