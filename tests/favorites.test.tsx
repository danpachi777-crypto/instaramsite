// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FavoriteButton } from "@/components/favorite-button";
import { FavoriteList, FavoriteSettings } from "@/components/favorites";
import { demoTemplates } from "@/lib/demo";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

it("お気に入りを保存し、再表示して、設定から削除できる", async () => {
  const user = userEvent.setup();
  const view = render(<FavoriteButton slug="runway-walk" title="ランウェイウォーク" />);
  const add = await screen.findByRole("button", { name: "ランウェイウォークをお気に入りに登録する" });
  await waitFor(() => expect(add.hasAttribute("disabled")).toBe(false));
  await user.click(add);
  expect(JSON.parse(window.localStorage.getItem("motion:favorites:v1")!)).toEqual(["runway-walk"]);
  view.unmount();

  render(<><FavoriteButton slug="runway-walk" title="ランウェイウォーク" /><FavoriteList templates={demoTemplates} /><FavoriteSettings /></>);
  expect(screen.getAllByRole("button", { name: "ランウェイウォークをお気に入りから外す" })).toHaveLength(2);
  expect(screen.getByText("1件保存しています。")).toBeTruthy();
  expect(screen.getByRole("link", { name: "ランウェイウォークを詳しく見る" }).getAttribute("href")).toBe("/templates/runway-walk");
  await user.click(screen.getByRole("button", { name: "お気に入りをすべて削除" }));
  expect(JSON.parse(window.localStorage.getItem("motion:favorites:v1")!)).toEqual([]);
  expect(screen.getByRole("button", { name: "ランウェイウォークをお気に入りに登録する" })).toBeTruthy();
  expect(screen.getByText("お気に入りはまだありません。")).toBeTruthy();
});
