"use client";

import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
const ProductVisual = lazy(() =>
  import("./product-visual").then((m) => ({ default: m.ProductVisual })),
);

export function RegistrationButton() {
  return (
    <div className="desktop-signup-actions">
      <button
        className="button primary"
        type="button"
        onClick={() => window.dispatchEvent(new Event("motion:registration"))}
      >
        先行案内に登録 <span aria-hidden="true">↗</span>
      </button>
      <Link href="/templates">スタイルを見る +</Link>
    </div>
  );
}
export function FooterRegistrationButton() {
  return (
    <button
      type="button"
      className="desktop-footer-registration"
      onClick={() => window.dispatchEvent(new Event("motion:registration"))}
    >
      先行案内に登録 +
    </button>
  );
}
export function ResponsiveRegistration({ children }: { children: ReactNode }) {
  const [desktop, setDesktop] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const query = matchMedia(
      "(min-width: 601px) and (any-pointer: fine), (min-width: 1200px)",
    );
    const update = () => setDesktop(query.matches);
    const frame = requestAnimationFrame(update);
    query.addEventListener("change", update);
    const open = () => dialog.current?.showModal();
    window.addEventListener("motion:registration", open);
    return () => {
      cancelAnimationFrame(frame);
      query.removeEventListener("change", update);
      window.removeEventListener("motion:registration", open);
    };
  }, []);
  if (!desktop) return <div className="signup-registration">{children}</div>;
  return (
    <>
      <div className="desktop-product-media">
        <Suspense fallback={null}>
          <ProductVisual />
        </Suspense>
      </div>
      <dialog
        ref={dialog}
        className="registration-dialog"
        data-lenis-prevent
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div>
          <button
            type="button"
            className="registration-close"
            aria-label="閉じる"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
          <p className="eyebrow">MOTION / 先行案内</p>
          <h2>
            新しいスタイルを、
            <br />
            見逃さないで。
          </h2>
          {children}
        </div>
      </dialog>
    </>
  );
}
