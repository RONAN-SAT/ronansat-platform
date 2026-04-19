import { clearClientCache } from "@/lib/clientCache";
import { INITIAL_TAB_BOOT_PENDING_KEY, INITIAL_TAB_LOAD_SEEN_KEY, INITIAL_TAB_PRELOAD_READY_KEY } from "@/lib/initialTabLoad";
import { TESTING_ROOM_THEME_STORAGE_KEY } from "@/lib/testingRoomTheme";

const SESSION_STORAGE_KEYS = [
  INITIAL_TAB_LOAD_SEEN_KEY,
  INITIAL_TAB_BOOT_PENDING_KEY,
  INITIAL_TAB_PRELOAD_READY_KEY,
  "testName",
];

const LOCAL_STORAGE_KEYS = [TESTING_ROOM_THEME_STORAGE_KEY];
const LOCAL_STORAGE_PREFIXES = ["ronan-sat-vocab-board:"];

export function clearClientSessionState() {
  clearClientCache();

  if (typeof window === "undefined") {
    return;
  }

  try {
    SESSION_STORAGE_KEYS.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Ignore storage cleanup failures and continue.
  }

  try {
    LOCAL_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));

    Object.keys(window.localStorage)
      .filter((key) => LOCAL_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix)))
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Ignore storage cleanup failures and continue.
  }
}
