"use client";

import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";

const AnimalStage = lazy(() =>
  import("./animal-stage").then((module) => ({ default: module.AnimalStage })),
);

const desktopMedia = "(min-width: 601px) and (any-pointer: fine), (min-width: 1200px)";

export function DesktopMotion() {
  const [desktop, setDesktop] = useState(false);
  const [complete, setComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const handleSceneReady = useCallback(() => setSceneReady(true), []);

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
    if (!desktop) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = window.requestAnimationFrame(() => setComplete(true));
      return () => window.cancelAnimationFrame(frame);
    }
    const started = performance.now();
    const interval = window.setInterval(() => {
      setProgress(Math.min(100, Math.floor(((performance.now() - started) / 4100) * 100)));
    }, 40);
    const timeout = window.setTimeout(() => {
      setProgress(100);
      setComplete(true);
    }, 4400);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [desktop]);

  useEffect(() => {
    if (!desktop) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const track = document.querySelector(".desktop-motion-track");
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - window.innerHeight)));
      setStep(fraction > 0.72 ? 2 : fraction > 0.35 ? 1 : 0);
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
      <div className={`desktop-intro${complete ? " is-complete" : ""}`} aria-hidden={complete}>
        <div className="desktop-intro-console" aria-hidden="true">
          / LAUNCHING_MOTION_STUDIO<br />
          / SEQUENCE_INITIATED<br />
          / AUTHENTICATING_RUNTIME<br />
          / GENERATING_AI_VIDEO<br />
          / LOADING_SCENE_SHARDS<br />
          / PREPARING_NEXT_STORY
        </div>
        <div className="desktop-intro-code" aria-hidden="true">
          const scene = await createMotion();<br />
          let frames = 0;<br />
          while (ideas.length) &#123;<br />
          &nbsp;&nbsp;frames += render(ideas);<br />
          &#125;
        </div>
        <div className="desktop-intro-center" aria-hidden="true">
          <span className="desktop-intro-ring outer" />
          <span className="desktop-intro-ring inner" />
          <span className="desktop-intro-logo">M</span>
          <i /><i /><i /><i />
        </div>
        <div className="desktop-intro-bottom-left">
          <span className="desktop-intro-globe" aria-hidden="true">◉</span>
          <span>/ AI動画作成中<br />/ シーンを読み込み中<br /><strong>/ {progress}%_COMPLETE</strong></span>
        </div>
        <div className="desktop-intro-bottom-right">
          <span>{progress}%</span><span>_AI動画作成中</span>
        </div>
        <button className="desktop-intro-skip" type="button" onClick={() => setComplete(true)}>
          SKIP ANIMATION ↓
        </button>
        <span className="desktop-intro-screenreader" role="status">
          {sceneReady ? "AI動画のシーンを準備しました" : "AI動画のシーンを読み込み中"}
        </span>
      </div>

      <div className="desktop-motion-track">
        <section className={`desktop-motion${complete ? " is-ready" : ""} step-${step}`} aria-label="MOTION の紹介">
          <Suspense fallback={null}>
            {desktop && <AnimalStage onReady={handleSceneReady} />}
          </Suspense>
          <div className="desktop-motion-vignette" aria-hidden="true" />
          <div className="desktop-motion-hud" aria-hidden="true">
            <span>/ MOTION_SEQUENCE_ACTIVE</span>
            <span>/ SCENE_0{step + 1} / 03</span>
          </div>
          <div className="desktop-motion-layers" aria-hidden="true">
            <span /><span /><span /><span /><span />
          </div>
          <div className="desktop-motion-hero-copy">
            <h1>次話題の動画はここから。</h1>
            <div className="desktop-motion-subline">
              <span>あなたの次の一本</span><i /><span>AIで広がる表現</span><i /><span>まだ見たことのない世界</span>
            </div>
          </div>
          <div className="desktop-motion-story">
            <p className="desktop-motion-story-kicker">MOTION / 01 — 03</p>
            <h2>{step === 2 ? "次の一本を、ここから。" : "想像した世界が、動き出す。"}</h2>
            <p>
              {step === 2
                ? "好きなスタイルを選んで、公開のお知らせを受け取ろう。"
                : "気になる作例から、次のリールに使いたいスタイルを見つけよう。"}
            </p>
            <Link href={step === 2 ? "/#waitlist" : "/templates"}>
              {step === 2 ? "先行案内に登録" : "テンプレートを見る"} ↗
            </Link>
            <span className="desktop-motion-story-index">0{step} / 03</span>
          </div>
          <div className="desktop-motion-status">
            <span className="desktop-motion-status-mark" aria-hidden="true">◎</span>
            <span>/ MOTION_STUDIO<br />/ SCENE_INITIALIZED<br />/ SCROLL_TO_EXPLORE</span>
          </div>
          <span className="desktop-motion-scroll">SCROLL TO EXPLORE<br />⌄</span>
        </section>
      </div>
    </>
  );
}
