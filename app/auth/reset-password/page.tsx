"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/client";

import InitialTabBootReady from "@/components/InitialTabBootReady";
import AuthWorkbookShell from "@/components/auth/AuthWorkbookShell";
import Loading from "@/components/Loading";
import { getPostAuthRedirectPath } from "@/lib/getPostAuthRedirectPath";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type MessageTone = "success" | "error";

function ResetPasswordForm() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("success");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(getPostAuthRedirectPath(session?.user));
    }
  }, [router, session?.user, session?.user?.hasCompletedProfile, session?.user?.role, status]);

  if (status === "loading" || status === "authenticated") {
    return <Loading showQuote={false} />;
  }

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      setMessageTone("error");
      setMessage("Your passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        throw error;
      }

      setMessageTone("success");
      setMessage("Password updated. Redirecting you back to sign in...");
      window.setTimeout(() => router.push("/auth"), 2000);
    } catch (error: unknown) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Unable to reset your password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthWorkbookShell
      badge="New Password"
      title="Lock in a clean reset and get back to practice."
      description="Choose a new password, confirm it once, and step back into your SAT workflow."
      accentClass="bg-accent-2"
      notes={[
        "Use a password you will remember during busy study weeks.",
        "After reset, you will return to the main sign-in screen automatically.",
      ]}
      cardTitle="Set your new password"
      cardDescription="Finish the reset with a new password for this account."
      backHref="/auth/forgot-password"
      backLabel="Back to code request"
    >
      <InitialTabBootReady />
      {message ? (
        <div
          className={`mb-5 rounded-2xl border-2 border-ink-fg px-4 py-3 text-sm font-medium leading-6 ${
            messageTone === "error" ? "bg-accent-3 text-white" : "bg-primary text-ink-fg"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-bold uppercase tracking-[0.16em] text-ink-fg">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Create a new password"
            className="workbook-input"
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold uppercase tracking-[0.16em] text-ink-fg">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat your new password"
            className="workbook-input"
            autoComplete="new-password"
          />
        </div>

        <button onClick={handleSubmit} className="workbook-button w-full" disabled={isSubmitting} type="button">
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </div>
    </AuthWorkbookShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loading showQuote={false} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
