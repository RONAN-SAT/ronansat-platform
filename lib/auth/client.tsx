"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { type AppSession, buildAppSession } from "@/lib/auth/session";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

type SessionContextValue = {
  data: AppSession | null;
  status: SessionStatus;
  update: (updates?: Partial<AppSession["user"]>) => Promise<AppSession | null>;
};

type SignInOptions = {
  email?: string;
  password?: string;
  redirect?: boolean;
  callbackUrl?: string;
};

type SignInResult = {
  error?: string;
  ok?: boolean;
  url?: string | null;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

function getRedirectUrl(callbackUrl?: string) {
  if (!callbackUrl) {
    return `${window.location.origin}/auth/redirect`;
  }

  if (callbackUrl.startsWith("http://") || callbackUrl.startsWith("https://")) {
    return callbackUrl;
  }

  return `${window.location.origin}${callbackUrl}`;
}

async function fetchBrowserSession(user: User | null) {
  if (!user) {
    return null;
  }

  const response = await fetch("/api/user/profile-gate", { cache: "no-store" });
  if (!response.ok) {
    return {
      user: {
        id: user.id,
        email: user.email ?? null,
        name: typeof user.user_metadata?.name === "string" ? user.user_metadata.name : user.email ?? null,
        role: "STUDENT" as const,
        hasCompletedProfile: false,
      },
    } satisfies AppSession;
  }

  const payload = (await response.json()) as {
    role?: AppSession["user"]["role"];
    username?: string;
    birthDate?: string;
    displayName?: string;
    hasCompletedProfile?: boolean;
  };

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      name: payload.displayName ?? (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : user.email ?? null),
      role: payload.role ?? "STUDENT",
      username: payload.username,
      birthDate: payload.birthDate,
      hasCompletedProfile: Boolean(payload.hasCompletedProfile),
    },
  } satisfies AppSession;
}

export function SessionProvider({ children, session }: { children: React.ReactNode; session: AppSession | null }) {
  const [data, setData] = useState<AppSession | null>(session);
  const [status, setStatus] = useState<SessionStatus>(session ? "authenticated" : "loading");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const bootstrap = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const nextSession = await fetchBrowserSession(user);
      setData(nextSession);
      setStatus(nextSession ? "authenticated" : "unauthenticated");
    };

    void bootstrap();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, sessionState) => {
      void fetchBrowserSession(sessionState?.user ?? null).then((nextSession) => {
        setData(nextSession);
        setStatus(nextSession ? "authenticated" : "unauthenticated");
      });
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      data,
      status,
      update: async (updates) => {
        if (!data?.user.id) {
          return null;
        }

        const nextSession = {
          user: {
            ...data.user,
            ...updates,
          },
        } satisfies AppSession;

        setData(nextSession);
        setStatus("authenticated");
        return nextSession;
      },
    }),
    [data, status]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used inside SessionProvider.");
  }

  return context;
}

export async function getSession() {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return fetchBrowserSession(user);
}

export async function signIn(provider: string, options: SignInOptions = {}): Promise<SignInResult | undefined> {
  const supabase = createSupabaseBrowserClient();

  if (provider === "credentials") {
    const { error } = await supabase.auth.signInWithPassword({
      email: options.email ?? "",
      password: options.password ?? "",
    });

    return {
      error: error?.message,
      ok: !error,
      url: error ? null : options.callbackUrl ?? null,
    };
  }

  if (provider === "google") {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getRedirectUrl(options.callbackUrl),
      },
    });

    return {
      error: error?.message,
      ok: !error,
      url: data?.url ?? null,
    };
  }

  return {
    error: `Unsupported provider: ${provider}`,
    ok: false,
    url: null,
  };
}

export async function signOut(options?: { callbackUrl?: string }) {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();

  if (options?.callbackUrl) {
    window.location.assign(options.callbackUrl);
  }
}
