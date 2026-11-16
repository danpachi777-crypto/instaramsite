"use client";

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Lenis from "lenis";
import { chapterAnchors, sceneChapter, scenePanel } from "./scene-timeline";
import { PhoneLoading } from "./phone-loading";
import { screenCopy } from "./screen-copy";

const AnimalStage = lazy(() =>
  import("./animal-stage").then((module) => ({ default: module.AnimalStage })),
);

const desktopMedia =
  "(min-width: 601px) and (any-pointer: fine), (min-width: 1200px)";

export function DesktopMotion() {
  const [desktop, setDesktop] = useState(false);
  const [complete, setComplete] = useState(false);
  const [step, setStep] = useState(0);
  const [chapter, setChapter] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [inScene, setInScene] = useState(true);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const handleSceneReady = useCallback(() => setSceneReady(true), []);

  useEffect(() => {
    if (
      !desktop ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      anchors: true,
    });
    let frame = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [desktop]);

  useEffect(() => {
    if (!desktop || !titleRef.current) return;
    const title = titleRef.current;
    const text = title.querySelector("span");
    if (!text) return;
    const fit = () => {
      title.style.setProperty(
        "--title-stretch",
        String(Math.min(0.75, title.clientWidth / Math.max(text.offsetWidth, 1))),
      );
    };
    const observer = new ResizeObserver(fit);
    observer.observe(title);
    void document.fonts.ready.then(fit);
    fit();
    return () => observer.disconnect();
  }, [desktop]);

  useEffect(() => {
    const query = window.matchMedia(desktopMedia);
    const update = () => setDesktop(query.matches);
    const frame = window.requestAnimationFrame(update);
    query.addEventListener("change", update);
    return () => {
      window.cancelAnimationFrame(frame);
      query.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!desktop || !sceneReady) return;
    const frame = requestAnimationFrame(() => {
      setComplete(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [desktop, sceneReady]);

  useEffect(() => {
    if (!desktop) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const track = document.querySelector(".desktop-motion-track");
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const height = -rect.top / window.innerHeight;
      setInScene(height < 16);
      setStep(scenePanel(height));
      setChapter(sceneChapter(height));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [desktop]);

  return (
    <>
      <div
        className={`desktop-intro phone-loading-intro${complete ? " is-complete" : ""}`}
        aria-hidden={complete}
      >
        <PhoneLoading />
        <p className="phone-loading-wordmark" aria-hidden="true">MOTION</p>
        <button
          className="phone-loading-skip"
          type="button"
          onClick={() => { setComplete(true); document.getElementById("examples")?.scrollIntoView(); }}
        >
          演出をスキップして作例へ ↗
        </button>
        <span className="desktop-intro-screenreader" role="status">
          {sceneReady
            ? "AI動画のシーンを準備しました"
            : "AI動画のシーンを読み込み中"}
        </span>
      </div>

      <div className="desktop-motion-track">
        {chapterAnchors.map((height, index) => (
          <span
            key={index}
            id={`motion-chapter-${index}`}
            className="desktop-motion-anchor"
            style={{ top: `${height * 100}svh` }}
          />
        ))}
        <section
          className={`desktop-motion${complete ? " is-ready" : ""} step-${step}`}
          data-chapter={chapter}
          data-active={inScene}
          aria-hidden={!inScene}
          inert={!inScene}
          aria-label="MOTION の紹介"
        >
          <Suspense fallback={null}>
            {desktop && (
              <AnimalStage onReady={handleSceneReady} active={complete && inScene} />
            )}
          </Suspense>
          <div className="desktop-motion-vignette" aria-hidden="true" />
          <div className="desktop-motion-hud" aria-hidden="true">
            <span>/ MOTION_SEQUENCE_ACTIVE</span>
            <span>/ SCENE_0{step + 1} / 03</span>
          </div>
          <nav
            className="desktop-motion-layers"
            aria-label="アニメーションの章"
          >
            {[0, 1, 2, 3, 4].map((index) => (
              <a
                key={index}
                href={`#motion-chapter-${index}`}
                aria-label={
                  [
                    "オープニング",
                    "想像した世界",
                    "あなたの表現",
                    "次の一本",
                    "全世界へ",
                  ][index]
                }
                aria-current={chapter === index ? "step" : undefined}
                data-passed={chapter >= index}
              >
                <span className="chapter-name">{["オープニング", "想像した世界", "あなたの表現", "次の一本", "全世界へ"][index]}</span>
                <svg viewBox="0 0 44 24" fill="none" aria-hidden="true">
                  <path
                    d="M23 1.5 42 10.5Q44 12 42 13.5L23 22.5Q22 23 21 22.5L2 13.5Q0 12 2 10.5L21 1.5Q22 1 23 1.5Z"
                    stroke="currentColor"
                    strokeWidth=".8"
                  />
                </svg>
              </a>
            ))}
          </nav>
          <div className="desktop-motion-hero-copy" inert={step !== 0}>
            <h1 ref={titleRef}>
              <span>次に話題になる動画はここから</span>
            </h1>
            <p>リール向けのAI動画スタイルを探せる、MOTION。</p>
            <Link className="button primary" href="/templates">動画作例を見る ↗</Link>
          </div>
          {step > 0 && <div className="desktop-motion-story" key={step}>
            <h2>
              {screenCopy[Math.min(screenCopy.length - 1, Math.max(0, step - 1))].map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>
            <p>
              気になる作例から、次のリールに使いたいスタイルを見つけよう。
            </p>
            <Link className="button primary" href="/templates">
              動画作例を見る ↗
            </Link>
            <span className="desktop-motion-story-index">0{step} / 03</span>
          </div>}
          <a
            className="desktop-motion-scroll"
            href="#examples"
            aria-label="演出をスキップして作例へ"
          >
            演出をスキップして作例へ ↗
          </a>
          <p className="desktop-motion-summary">
            MOTIONから、次のクリエイティブへ。
            <br />
            AI動画のスタイルを見つけて、
            <br />
            あなたの次の一本につなげよう。
          </p>
          <div className="desktop-world-outro" inert={chapter !== 4}>
            <h2 className="desktop-world-message">あなたの動画を<span>全世界へ</span></h2>
            <a className="button primary" href="#examples">動画作例を見る ↗</a>
          </div>
        </section>
      </div>
    </>
  );
}
