// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeStudio } from "@/components/home-studio";

afterEach(cleanup);

it("複数カテゴリを選び、REC枠にまとめ、解除できる", async () => {
  const user = userEvent.setup();
  render(<HomeStudio />);
  await user.click(screen.getByRole("button", { name: "ファッションを選択" }));
  await user.click(screen.getByRole("button", { name: "商品紹介を選択" }));

  const frame = screen.getByLabelText("選択した動画カテゴリ");
  expect(within(frame).getAllByRole("listitem")).toHaveLength(2);
  expect(within(frame).getByRole("button", { name: "ファッションの選択を解除" })).toBeTruthy();
  expect(within(frame).getByText(/2 SELECTED/)).toBeTruthy();
  expect(screen.queryByRole("link", { name: /動画を作る/ })).toBeNull();
  expect(screen.queryByText("スタイルを探す")).toBeNull();

  await user.click(within(frame).getByRole("button", { name: "ファッションの選択を解除" }));
  expect(within(frame).getAllByRole("listitem")).toHaveLength(1);
  expect(within(frame).getByText(/1 SELECTED/)).toBeTruthy();

  await user.click(screen.getByRole("button", { name: "選択をクリア" }));
  expect(within(frame).getByText(/0 SELECTED/)).toBeTruthy();
  expect(screen.queryByRole("link", { name: /動画を作る/ })).toBeNull();
});

it("追加カテゴリと動画の説明を一緒に確認できる", async () => {
  const user = userEvent.setup();
  render(<HomeStudio />);
  await user.click(screen.getByRole("button", { name: "旅行を選択" }));
  await user.click(screen.getByRole("button", { name: "ペットを選択" }));
  const idea = screen.getByRole("textbox", { name: "どんな動画にしたい？" });
  await user.type(idea, "愛犬と海辺を歩く、明るい旅行動画");

  const frame = screen.getByLabelText("選択した動画カテゴリ");
  expect(within(frame).getAllByRole("listitem")).toHaveLength(2);
  expect(within(frame).getByText("愛犬と海辺を歩く、明るい旅行動画")).toBeTruthy();
  expect(screen.getByText("16 / 300文字")).toBeTruthy();
  expect(idea).toHaveProperty("maxLength", 300);
});
