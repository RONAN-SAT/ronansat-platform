import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "NextAuth has been replaced by Supabase Auth." }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: "NextAuth has been replaced by Supabase Auth." }, { status: 410 });
}
