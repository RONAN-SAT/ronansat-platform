import type { AppSession } from "@/lib/auth/session";
import { getServerAppSession } from "@/lib/auth/session";

export type Session = AppSession;
export type DefaultSession = AppSession;
export type User = AppSession["user"];

export async function getServerSession(..._args: unknown[]) {
  return getServerAppSession();
}
