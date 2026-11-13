"use client";

import { useState } from "react";
import { videoCategories, type VideoCategoryKey } from "@/lib/video-categories";

export function HomeStudio() {
  const [selected, setSelected] = useState<VideoCategoryKey[]>([]);
  const [description, setDescription] = useState("");

  const toggle = (key: VideoCategoryKey) => {
    setSelected((current) => current.includes(key)
      ? current.filter((item) => item !== key)
      : [...current, key]);
  };

  return (
    <>
      <section className="studio container" aria-labelledby="studio-title">
        <div className="studio-heading">
          <span className="eyebrow">MOTION / DIRECTOR FRAME</span>
          <h1 id="studio-title">作りたい動画の、<span>世界を選ぼう。</span></h1>
          <p>動画のカテゴリをいくつでも選べます。</p>
        </div>
        <div className="rec-frame" aria-label="選択した動画カテゴリ">
          <div className="rec-frame-top"><span className="rec-light" /> REC <span className="rec-count">{selected.length} SELECTED</span></div>
          <div className="rec-orb" aria-hidden="true" />
          {selected.length ? (
            <div className={`rec-selected${description.trim() ? " has-description" : ""}`} role="list">
              {selected.map((key) => {
                const item = videoCategories.find((entry) => entry.key === key)!;
                return (
                  <div className="rec-selected-item" role="listitem" key={key}>
                    <button type="button" onClick={() => toggle(key)} aria-label={`${item.label}の選択を解除`} style={{ "--category-color": item.color } as React.CSSProperties}>
                      <span aria-hidden="true">{item.icon}</span><i aria-hidden="true">−</i>
                    </button>
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          ) : !description.trim() ? (
            <p className="rec-prompt">下のカテゴリを選ぶと、ここに集まります。</p>
          ) : null}
          {description.trim() && (
            <p className="rec-description"><span>MY IDEA</span>{description.trim()}</p>
          )}
          <div className="rec-corner top-left" /><div className="rec-corner top-right" />
          <div className="rec-corner bottom-left" /><div className="rec-corner bottom-right" />
        </div>
        <div className="studio-category-heading">
          <h2>動画のカテゴリ</h2>
          {selected.length > 0 && <button type="button" onClick={() => setSelected([])}>選択をクリア</button>}
        </div>
        <div className="studio-categories" aria-label="動画カテゴリを選ぶ">
          {videoCategories.map(({ key, label, icon, color }) => {
            const active = selected.includes(key);
            return (
              <button
                key={key}
                type="button"
                className={`studio-category${active ? " is-selected" : ""}`}
                style={{ "--category-color": color } as React.CSSProperties}
                aria-pressed={active}
                aria-label={`${label}を${active ? "選択解除" : "選択"}`}
                onClick={() => toggle(key)}
              >
                <span className="studio-category-icon" aria-hidden="true">{icon}</span>
                <span>{label}</span>
                {active && <b aria-hidden="true">✓</b>}
              </button>
            );
          })}
        </div>
        <div className="studio-idea">
          <label htmlFor="studio-description">どんな動画にしたい？</label>
          <p id="studio-description-help">登場するもの、雰囲気、動きなどを自由に書いてください。</p>
          <textarea
            id="studio-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={300}
            rows={4}
            placeholder="例：夕暮れの海辺を歩くシーン。映画のような光で、ゆっくりズームする動画にしたい。"
            aria-describedby="studio-description-help studio-description-count"
          />
          <span id="studio-description-count" className="studio-idea-count">{description.length} / 300文字</span>
        </div>
      </section>
    </>
  );
}
