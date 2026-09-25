import { SIGNED_OUT_STORAGE } from "@/lib/auth-constants";

export function markSignedOut(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SIGNED_OUT_STORAGE, "1");
  } catch {
    /* ignore */
  }
}

export function clearSignedOut(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SIGNED_OUT_STORAGE);
  } catch {
    /* ignore */
  }
}

export function isSignedOut(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SIGNED_OUT_STORAGE) === "1";
  } catch {
    return false;
  }
}

/** Clear auth cookies via BFF redirect — survives failed fetch / Telegram auto-relogin races. */
export function redirectToLogout(): void {
  markSignedOut();
  window.location.replace("/api/auth/logout");
}
