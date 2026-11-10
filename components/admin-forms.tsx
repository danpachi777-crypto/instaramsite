"use client";
import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  categories,
  aspectRatios,
  templateSchema,
  type Template,
} from "@/lib/validation";
import { clientApi as callApi } from "@/lib/client-api";
export function LoginForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const router = useRouter();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    try {
      await callApi("/api/admin/login", "POST", {
        email: form.get("email"),
        password: form.get("password"),
      });
      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "ログインできませんでした。",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="panel" aria-busy={busy}>
      <fieldset disabled={busy}>
        <label htmlFor="login-email">メールアドレス</label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="username"
        />
        <label htmlFor="login-password">パスワード</label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          maxLength={128}
          autoComplete="current-password"
        />
        <button className="button primary full" type="submit">
          {busy ? "確認しています…" : "ログインする"}
        </button>
      </fieldset>
      <p role="status" className="form-result error">
        {message}
      </p>
    </form>
  );
}
export function LogoutButton() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <div>
      <button
        className="button secondary small"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await callApi("/api/admin/logout", "POST");
            router.replace("/admin/login");
            router.refresh();
          } catch {
            setMessage("ログアウトできませんでした。");
          } finally {
            setBusy(false);
          }
        }}
      >
        ログアウト
      </button>
      <span role="status">{message}</span>
    </div>
  );
}
export function TemplateForm({ template }: { template?: Template }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const router = useRouter();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    const form = new FormData(e.currentTarget);
    const input = templateSchema.safeParse({
      slug: form.get("slug"),
      title: form.get("title"),
      description: form.get("description"),
      category: form.get("category"),
      aspect_ratio: form.get("aspect_ratio"),
      preview_url: form.get("preview_url"),
      poster_url: form.get("poster_url"),
      sort_order: Number(form.get("sort_order")),
      is_published: form.get("is_published") === "on",
    });
    if (!input.success) {
      setMessage(
        input.error.issues[0]?.message ?? "入力内容を確認してください。",
      );
      return;
    }
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      await callApi(
        template
          ? `/api/admin/templates/${template.id}`
          : "/api/admin/templates",
        template ? "PUT" : "POST",
        input.data,
      );
      router.push("/admin/templates");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "保存できませんでした。",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <form className="panel template-form" onSubmit={submit} aria-busy={busy}>
      <fieldset disabled={busy}>
        <label htmlFor="title">
          テンプレート名 <span className="required">必須</span>
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={80}
          defaultValue={template?.title}
        />
        <label htmlFor="slug">
          URL名 <span className="required">必須</span>
        </label>
        <p className="field-help" id="slug-help">
          半角英数字とハイフン。変更すると以前のURLは使えなくなります。
        </p>
        <input
          id="slug"
          name="slug"
          required
          maxLength={100}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          aria-describedby="slug-help"
          defaultValue={template?.slug}
        />
        <label htmlFor="description">短い説明・想定用途</label>
        <textarea
          id="description"
          name="description"
          required
          maxLength={500}
          rows={4}
          defaultValue={template?.description}
        />
        <div className="form-columns">
          <div>
            <label htmlFor="category">カテゴリー</label>
            <select
              id="category"
              name="category"
              defaultValue={template?.category ?? "fashion"}
            >
              {Object.entries(categories).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="aspect_ratio">縦横比</label>
            <select
              id="aspect_ratio"
              name="aspect_ratio"
              defaultValue={template?.aspect_ratio ?? "9:16"}
            >
              {aspectRatios.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>
        <label htmlFor="preview_url">作例動画のURL（任意）</label>
        <p className="field-help" id="media-help">
          利用権のある無音の動画を指定してください。HTTPSのURL、または /demo/
          配下のパス。動画は再生ボタンを押したときに読み込みます。
        </p>
        <input
          id="preview_url"
          name="preview_url"
          maxLength={2048}
          aria-describedby="media-help"
          defaultValue={template?.preview_url ?? ""}
        />
        <label htmlFor="poster_url">
          画像・動画ポスターのURL（動画がある場合は必須）
        </label>
        <input
          id="poster_url"
          name="poster_url"
          maxLength={2048}
          aria-describedby="media-help"
          defaultValue={template?.poster_url ?? ""}
        />
        <label htmlFor="sort_order">表示順（小さい数字が先）</label>
        <input
          id="sort_order"
          name="sort_order"
          type="number"
          step={1}
          min={-100000}
          max={100000}
          required
          defaultValue={template?.sort_order ?? 0}
        />
        <label className="check-label" htmlFor="is_published">
          <input
            id="is_published"
            name="is_published"
            type="checkbox"
            defaultChecked={template?.is_published ?? false}
          />
          <span>素材の権利・表示内容を確認し、このテンプレートを公開する</span>
        </label>
        <button type="submit" className="button primary">
          {busy ? "保存しています…" : "変更を保存する"}
        </button>
      </fieldset>
      <p role="status" aria-live="polite" className="form-result error">
        {message}
      </p>
    </form>
  );
}
export function DeleteSubscriber({ id, email }: { id: string; email: string }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const lock = useRef(false);
  if (!confirming)
    return (
      <button
        className="delete-button"
        onClick={() => setConfirming(true)}
        aria-label={`${email}の削除を確認する`}
      >
        削除
      </button>
    );
  return (
    <div className="delete-confirm">
      <p>「{email}」の登録情報を削除します。元に戻せません。</p>
      <button
        className="button danger small"
        disabled={busy}
        onClick={async () => {
          if (lock.current) return;
          lock.current = true;
          setBusy(true);
          try {
            await callApi(`/api/admin/subscribers/${id}`, "DELETE", {
              email,
              confirm: true,
            });
            setMessage("削除しました。");
            router.refresh();
          } catch (error) {
            setMessage(
              error instanceof Error ? error.message : "削除できませんでした。",
            );
          } finally {
            lock.current = false;
            setBusy(false);
          }
        }}
      >
        {busy ? "削除しています…" : "この登録情報を削除する"}
      </button>
      <button
        className="button secondary small"
        disabled={busy}
        onClick={() => setConfirming(false)}
      >
        キャンセル
      </button>
      <p role="status">{message}</p>
    </div>
  );
}
