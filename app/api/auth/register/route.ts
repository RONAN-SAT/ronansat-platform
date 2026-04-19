import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Registration now uses Supabase Auth directly." }, { status: 410 });
}
