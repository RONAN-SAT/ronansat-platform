"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { LockKeyhole } from "lucide-react";

import InitialTabBootReady from "@/components/InitialTabBootReady";
import SimpleLoading from "@/components/SimpleLoading";
import { TestTokenDialog } from "@/components/test-access/TestTokenDialog";
import { useTestAccess } from "@/components/test-access/useTestAccess";
import { API_PATHS } from "@/lib/apiPaths";
import api from "@/lib/axios";

type TestRoomAccessGateProps = {
  testId: string;
  children: ReactNode;
};

export function TestRoomAccessGate({ testId, children }: TestRoomAccessGateProps) {
  const [requiresToken, setRequiresToken] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState("");
  const hasOpenedDialogRef = useRef(false);
  const access = useTestAccess({ testId, requiresToken: requiresToken ?? false });

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      setLoadError("");
      setRequiresToken(null);
      hasOpenedDialogRef.current = false;

      try {
        const params = new URLSearchParams({ testId });
        const response = await api.get(`${API_PATHS.TEST_ACCESS}?${params.toString()}`);

        if (!cancelled) {
          setRequiresToken(Boolean(response.data?.requiresToken));
        }
      } catch {
        if (!cancelled) {
          setLoadError("Failed to load access status for this test.");
        }
      }
    };

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, [testId]);

  useEffect(() => {
    if (requiresToken && !access.isUnlocked && !hasOpenedDialogRef.current) {
      hasOpenedDialogRef.current = true;
      access.openDialog();
    }
  }, [access, requiresToken]);

  if (requiresToken === null && !loadError) {
    return <SimpleLoading />;
  }

  if (loadError) {
    return (
      <div className="bg-dot-pattern flex min-h-screen items-center justify-center bg-paper-bg p-6 text-ink-fg">
        <InitialTabBootReady />
        <section className="workbook-panel max-w-lg px-8 py-10 text-center">
          <div className="workbook-sticker mx-auto w-fit bg-accent-3 text-white">Access Check</div>
          <h1 className="mt-5 font-display text-4xl font-black uppercase tracking-tight">Try again in a moment</h1>
          <p className="mt-3 text-base leading-7 text-ink-fg/75">{loadError}</p>
        </section>
      </div>
    );
  }

  if (requiresToken && !access.isUnlocked) {
    return (
      <div className="bg-dot-pattern flex min-h-screen items-center justify-center bg-paper-bg p-6 text-ink-fg">
        <InitialTabBootReady />
        <section className="workbook-panel max-w-lg px-8 py-10 text-center">
          <div className="workbook-sticker mx-auto w-fit bg-accent-2 text-white">
            <LockKeyhole className="h-4 w-4" />
            Locked Test
          </div>
          <h1 className="mt-5 font-display text-4xl font-black uppercase tracking-tight">Token required</h1>
          <p className="mt-3 text-base leading-7 text-ink-fg/75">
            Enter the token once on this device to open this practice test.
          </p>
          <button className="workbook-button mt-6 w-full justify-center" onClick={access.openDialog} type="button">
            Enter token to access this test
          </button>
        </section>
        <TestTokenDialog
          error={access.error}
          isSubmitting={access.isSubmitting}
          onClose={access.closeDialog}
          onSubmit={access.verifyToken}
          open={access.isDialogOpen}
          testTitle="Locked practice test"
        />
      </div>
    );
  }

  return <>{children}</>;
}
