import { AccessError } from "@/lib/access";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function assertOrigin(request: Request, expected: string) {
  if (
    request.headers.get("origin") !== expected ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new HttpError(403, "この操作はサイト内の画面から行ってください。");
}
export async function readJson(request: Request, max = 4096): Promise<unknown> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    throw new HttpError(415, "送信形式を確認してください。");
  const size = request.headers.get("content-length");
  if (size && (!/^\d+$/.test(size) || Number(size) > max))
    throw new HttpError(413, "送信内容が大きすぎます。");
  if (!request.body) throw new HttpError(400, "入力内容を確認してください。");
  const reader = request.body.getReader();
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > max) {
        await reader.cancel();
        throw new HttpError(413, "送信内容が大きすぎます。");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    chunks.forEach((c) => {
      bytes.set(c, offset);
      offset += c.length;
    });
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(
      400,
      "入力内容を読み取れませんでした。再入力してください。",
    );
  } finally {
    reader.releaseLock();
  }
}
export function json(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}
export function apiError(error: unknown) {
  if (error instanceof HttpError || error instanceof AccessError)
    return json(
      { message: error.message },
      error.status,
      error instanceof HttpError && error.status === 429
        ? { "Retry-After": "900" }
        : {},
    );
  // Never log requests, raw SDK errors or credentials.
  return json(
    {
      message: "ただいま処理できません。時間をおいて、もう一度お試しください。",
    },
    503,
  );
}
