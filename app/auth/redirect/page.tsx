import { getServerSession } from "@/lib/auth/server";
import { redirect } from "next/navigation";

import { getPostAuthRedirectPath } from "@/lib/getPostAuthRedirectPath";
export default async function AuthRedirectPage() {
  const session = await getServerSession();

  redirect(getPostAuthRedirectPath(session?.user));
}
