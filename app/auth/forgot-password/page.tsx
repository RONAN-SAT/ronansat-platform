"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { useEffect, useState } from "react";

import InitialTabBootReady from "@/components/InitialTabBootReady";
import AuthWorkbookShell from "@/components/auth/AuthWorkbookShell";
import Loading from "@/components/Loading";
import { getPostAuthRedirectPath } from "@/lib/getPostAuthRedirectPath";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type MessageTone = "success" | "error" | "info";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("info");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(getPostAuthRedirectPath(session?.user));
    }
  }, [router, session?.user, session?.user?.hasCompletedProfile, session?.user?.role, status]);

  if (status === "loading" || status === "authenticated") {
    return <Loading showQuote={false} />;
  }

  const handleSendCode = async () => {
    if (!email) {
      setMessageTone("error");
      setMessage("Enter your email first.");
      return;
    }

    setIsSending(true);
    setMessageTone("info");
      setMessage("Sending your verification code...");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      setMessageTone("success");
      setMessage("A password reset link has been sent to your email.");
    } catch (error: unknown) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Unable to send the reset email.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthWorkbookShell
      badge="Password Reset"
      title="Recover your study flow without losing momentum."
      description="Request a secure password reset link, then finish the reset directly from your email."
      accentClass="bg-accent-3"
      notes={[
        "Reset links are short-lived and meant for fast recovery.",
        "Use the same email you used to create your Ronan SAT account.",
      ]}
      cardTitle="Send your reset link"
      cardDescription="We will email a secure reset link you can open to choose a new password."
      backHref="/auth"
      backLabel="Back to sign in"
    >
      <InitialTabBootReady />
      {message ? (
        <div
          className={`mb-5 rounded-2xl border-2 border-ink-fg px-4 py-3 text-sm font-medium leading-6 ${
            messageTone === "error"
              ? "bg-accent-3 text-white"
              : messageTone === "success"
                ? "bg-primary text-ink-fg"
                : "bg-surface-white text-ink-fg"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-bold uppercase tracking-[0.16em] text-ink-fg">
            Account Email
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="workbook-input flex-1"
              autoComplete="email"
            />
            <button
              onClick={handleSendCode}
              className="workbook-button whitespace-nowrap"
              disabled={isSending}
              type="button"
            >
              {isSending ? "Sending..." : "Send Code"}
            </button>
          </div>
        </div>

      </div>
    </AuthWorkbookShell>
  );
}
