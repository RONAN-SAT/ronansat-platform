const memoryCache = new Map<string, unknown>();

function getStorageKey(key: string) {
  return `bluebook:${key}`;
}

export function getClientCache<T>(key: string): T | undefined {
  const memoryValue = memoryCache.get(key);
  if (memoryValue !== undefined) {
    return memoryValue as T;
  }

  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const rawValue = window.sessionStorage.getItem(getStorageKey(key));
    if (!rawValue) {
      return undefined;
    }

    const parsedValue = JSON.parse(rawValue) as T;
    memoryCache.set(key, parsedValue);
    return parsedValue;
  } catch {
    return undefined;
  }
}

export function setClientCache<T>(key: string, value: T) {
  memoryCache.set(key, value);

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(getStorageKey(key), JSON.stringify(value));
  } catch {
    // Ignore storage write failures and keep the in-memory cache only.
  }
}

export function deleteClientCache(key: string) {
  memoryCache.delete(key);

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(getStorageKey(key));
  } catch {
    // Ignore storage delete failures and continue.
  }
}
