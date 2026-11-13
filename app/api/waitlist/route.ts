import { NextResponse } from "next/server";

// Keep the former endpoint closed so old clients cannot create new registrations.
export async function POST() {
  return NextResponse.json({ message: "この機能は終了しました。" }, { status: 410 });
}
