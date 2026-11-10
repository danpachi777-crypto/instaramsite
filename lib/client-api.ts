"use client";
type ApiResult = { message?: string; redirect?: string };
export async function clientApi(
  path: string,
  method: string,
  body?: unknown,
): Promise<ApiResult> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "通信できませんでした。接続を確認して、もう一度お試しください。",
    );
  }
  let data: ApiResult;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "ただいま処理できません。時間をおいて、もう一度お試しください。",
    );
  }
  if (!response.ok)
    throw new Error(
      typeof data?.message === "string"
        ? data.message
        : "処理できませんでした。もう一度お試しください。",
    );
  return data;
}
