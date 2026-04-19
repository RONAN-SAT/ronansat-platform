"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";

import {
  DEFAULT_TESTING_ROOM_THEME,
  persistTestingRoomTheme,
  readStoredTestingRoomTheme,
  type TestingRoomTheme,
} from "@/lib/testingRoomTheme";

export function useTestingRoomTheme() {
  const { data: session, status } = useSession();
  const [theme, setTheme] = useState<TestingRoomTheme>(DEFAULT_TESTING_ROOM_THEME);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const localTheme = readStoredTestingRoomTheme();
      setTheme(localTheme);
      setHasHydrated(true);

      if (status === "authenticated" && session?.user?.id) {
        void fetch("/api/user/settings", { cache: "no-store" })
          .then(async (response) => {
            if (!response.ok) {
              return null;
            }

            const payload = (await response.json()) as { user?: { testingRoomTheme?: TestingRoomTheme } };
            return payload.user?.testingRoomTheme;
          })
          .then((remoteTheme) => {
            if (remoteTheme) {
              setTheme(remoteTheme);
              persistTestingRoomTheme(remoteTheme);
            }
          })
          .catch(() => undefined);
      }
    });

    const handleStorage = () => {
      setTheme(readStoredTestingRoomTheme());
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("storage", handleStorage);
    };
  }, [session?.user?.id, status]);

  const updateTheme = (nextTheme: TestingRoomTheme) => {
    setTheme(nextTheme);
    persistTestingRoomTheme(nextTheme);

    if (status === "authenticated" && session?.user?.id) {
      void fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testingRoomTheme: nextTheme }),
      }).catch(() => undefined);
    }
  };

  return { theme, setTheme: updateTheme, hasHydrated };
}
