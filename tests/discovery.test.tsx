// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguagePicker, LanguageProvider, T } from "@/components/i18n";
import { IdeaCard } from "@/components/idea-card";
import { FavoritesGallery } from "@/components/favorites-gallery";
import { FavoriteCount } from "@/components/header-navigation";
import { IdeaCarousel } from "@/components/idea-carousel";
import { demoTemplates } from "@/lib/demo";
import { favoritesKey, readFavorites } from "@/lib/favorites";
import { boardTagline, formKeys, formText, ideaTitle, languages, localeMessages, messageKeys, normalizeLocale, translate } from "@/lib/i18n";
vi.mock("@/components/preview", () => ({ Preview: () => <div>Preview</div> }));
beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.documentElement.dir = "ltr"; });
describe("international discovery", () => {
  it("has complete, nonempty dictionaries and idea titles for all 30 choices", () => {
    expect(languages).toHaveLength(30);
    for (const [locale] of languages) {
      expect(localeMessages[locale]).toHaveLength(messageKeys.length);
      for (const key of messageKeys) expect(translate(locale, key).trim()).not.toBe("");
      expect(translate(locale, "results", { count: 9 })).toContain("9");
      for (const key of formKeys) expect(formText(locale, key).trim()).not.toBe("");
      expect(boardTagline(locale).trim()).not.toBe("");
      for (const idea of demoTemplates) expect(ideaTitle(locale, idea.slug, "").trim()).not.toBe("");
    }
    expect(normalizeLocale("unexpected-value")).toBe("ja");
  });
  it("changes visible text, remembers the choice, and enables RTL", async () => {
    const user = userEvent.setup();
    render(<LanguageProvider initialLocale="ja"><LanguagePicker /><h1><T k="ideasHeading" /></h1></LanguageProvider>);
    await user.selectOptions(screen.getByRole("combobox"), "en");
    expect(screen.getByRole("heading").textContent).toBe(translate("en", "ideasHeading"));
    expect(document.cookie).toContain("motion-language=en");
    expect(document.documentElement.lang).toBe("en");
    await user.selectOptions(screen.getByRole("combobox"), "ar");
    expect(document.documentElement.dir).toBe("rtl");
    expect(screen.getByRole("heading").textContent).toBe(translate("ar", "ideasHeading"));
  });
  it("shares favorites between cards and the favorites page, and persists across a remount", async () => {
    const user = userEvent.setup();
    render(<><IdeaCard template={demoTemplates[0]} /><section aria-label="Saved"><FavoritesGallery templates={demoTemplates} /></section></>);
    expect(screen.getByText(translate("ja", "emptyFavorites"))).toBeTruthy();
    await user.click(screen.getByRole("button", { name: translate("ja", "addFavorite") }));
    expect(readFavorites(localStorage.getItem(favoritesKey)!)).toEqual(["runway-walk"]);
    expect(within(screen.getByRole("region", { name: "Saved" })).getByRole("heading").textContent).toBe(demoTemplates[0].title);
    cleanup();
    render(<FavoritesGallery templates={demoTemplates} />);
    expect(screen.getByRole("heading").textContent).toBe(demoTemplates[0].title);
    await user.click(screen.getByRole("button", { name: translate("ja", "removeFavorite") }));
    expect(readFavorites(localStorage.getItem(favoritesKey)!)).toEqual([]);
    expect(screen.getByText(translate("ja", "emptyFavorites"))).toBeTruthy();
  });
  it("recovers from malformed storage and excludes invalid slugs", () => {
    expect(readFavorites("not-json")).toEqual([]);
    expect(readFavorites(JSON.stringify(["runway-walk", "<script>", null, "runway-walk", "orbit-object"])) ).toEqual(["runway-walk", "orbit-object"]);
  });
  it("updates the header count when saving, removing, and changing storage in another tab", async () => {
    const user = userEvent.setup();
    localStorage.setItem(favoritesKey, JSON.stringify([demoTemplates[1].slug]));
    render(<><nav aria-label="Saved count"><FavoriteCount /></nav><IdeaCard template={demoTemplates[0]} /></>);
    const counter = screen.getByRole("navigation", { name: "Saved count" });
    expect(counter.textContent).toBe("1");
    expect(counter.querySelector(".is-just-saved")).toBeNull();
    await user.click(screen.getByRole("button", { name: translate("ja", "addFavorite") }));
    expect(counter.textContent).toBe("2");
    expect(counter.querySelector(".is-just-saved")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: translate("ja", "removeFavorite") }));
    expect(counter.textContent).toBe("1");
    localStorage.setItem(favoritesKey, "[]");
    fireEvent(window, new Event("storage"));
    expect(counter.textContent).toBe("");
  });
  it("tracks the carousel window and disables controls at either end", () => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    render(<IdeaCarousel templates={demoTemplates} />);
    const track = screen.getByRole("region", { name: translate("ja", "carouselLabel") });
    Object.defineProperties(track, { clientWidth: { value: 648 }, scrollWidth: { value: 2008 } });
    Object.defineProperty(track.firstElementChild!, "offsetWidth", { value: 200 });
    const scrollBy = vi.fn();
    track.scrollBy = scrollBy;
    fireEvent(window, new Event("resize"));
    const previous = screen.getByRole("button", { name: translate("ja", "previous") }) as HTMLButtonElement;
    const next = screen.getByRole("button", { name: translate("ja", "next") }) as HTMLButtonElement;
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);
    fireEvent.keyDown(track, { key: "ArrowRight" });
    expect(scrollBy).toHaveBeenCalledWith({ left: 518.4, behavior: "smooth" });
    track.scrollLeft = 680;
    fireEvent.scroll(track);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("50");
    expect(screen.getByRole("progressbar").getAttribute("aria-valuetext")).toBe("4–6 / 9");
    track.scrollLeft = 1360;
    fireEvent.scroll(track);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("100");
    expect(next.disabled).toBe(true);
    expect(previous.disabled).toBe(false);
  });
});
