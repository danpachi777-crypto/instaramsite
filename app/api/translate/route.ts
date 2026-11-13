import { NextResponse } from "next/server";
import { isLanguageCode } from "@/lib/languages";

const translations = new Map<string, string>();

async function requestTranslation(text: string, language: string, source: string): Promise<string> {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", source);
  url.searchParams.set("tl", language);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error("Translation service unavailable");
  const result: unknown = await response.json();
  if (!Array.isArray(result) || !Array.isArray(result[0])) {
    throw new Error("Invalid translation response");
  }
  const translated = result[0]
    .map((part: unknown) => Array.isArray(part) && typeof part[0] === "string" ? part[0] : "")
    .join("");
  if (!translated) throw new Error("Empty translation response");
  return translated;
}

async function translateAll(texts: string[], language: string): Promise<(string | null)[]> {
  const output: (string | null)[] = [...texts];
  const groups: { indexes: number[]; source: string; length: number }[] = [];
  texts.forEach((text, index) => {
    if (translations.has(`${language}\0${text}`)) {
      output[index] = translations.get(`${language}\0${text}`)!;
      return;
    }
    // Japanese and English labels need separate source language detection.
    const source = /[ぁ-んァ-ヶ一-龥]/u.test(text) ? "ja" : "en";
    const last = groups.at(-1);
    if (!last || last.source !== source || last.indexes.length >= 10 || last.length + text.length > 1200) {
      groups.push({ indexes: [index], source, length: text.length });
    } else {
      last.indexes.push(index);
      last.length += text.length + 1;
    }
  });

  for (const group of groups) {
    const originals = group.indexes.map((index) => texts[index]);
    let lines: string[];
    try {
      const translated = await requestTranslation(originals.join("\n"), language, group.source);
      lines = translated.split("\n");
    } catch {
      group.indexes.forEach((index) => { output[index] = null; });
      continue;
    }
    if (lines.length === originals.length) {
      group.indexes.forEach((index, position) => { output[index] = lines[position]; });
    } else {
      // Some languages merge line breaks. Translate those labels individually.
      for (const index of group.indexes) {
        try {
          output[index] = await requestTranslation(texts[index], language, group.source);
        } catch {
          output[index] = null;
        }
      }
    }
    if (translations.size > 10000) translations.clear();
    group.indexes.forEach((index) => {
      if (output[index] !== null) translations.set(`${language}\0${texts[index]}`, output[index]!);
    });
  }
  return output;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { language, texts } = body as { language?: unknown; texts?: unknown };
  if (typeof language !== "string" || !isLanguageCode(language) ||
    !Array.isArray(texts) || texts.length > 100 ||
    !texts.every((item) => typeof item === "string" && item.length <= 2000) ||
    texts.reduce((total: number, item: string) => total + item.length, 0) > 20000) {
    return NextResponse.json({ error: "Invalid language or text" }, { status: 400 });
  }
  if (language === "ja") return NextResponse.json({ translations: texts });

  return NextResponse.json({ translations: await translateAll(texts, language) });
}
