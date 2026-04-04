/**
 * localStorage throws SecurityError in sandboxed documents (e.g. iframes without
 * allow-same-origin, some in-IDE preview browsers). Use these helpers so the app
 * degrades instead of crashing.
 */

export function tryLocalStorageGet(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function tryLocalStorageSet(key: string, value: string): boolean {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function tryLocalStorageRemove(key: string): boolean {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** True when the document can read/write origin storage (not a locked-down sandbox). */
export function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const k = "__ls_probe__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}
