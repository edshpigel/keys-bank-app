import { isTelegramWebApp } from "@/lib/telegram";

/** Add `?kb_browser=1` to open the app in a desktop/mobile browser (skips install gate). */
export const PWA_BROWSER_BYPASS_PARAM = "kb_browser";
const PWA_BROWSER_BYPASS_STORAGE = "kb_app_browser_bypass";

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;

  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;

  for (const mode of ["standalone", "fullscreen", "minimal-ui"] as const) {
    if (window.matchMedia(`(display-mode: ${mode})`).matches) return true;
  }

  return false;
}

export function hasBrowserBypass(): boolean {
  if (typeof window === "undefined") return false;

  try {
    if (sessionStorage.getItem(PWA_BROWSER_BYPASS_STORAGE) === "1") return true;
  } catch {
    /* ignore */
  }

  const value = new URLSearchParams(window.location.search).get(PWA_BROWSER_BYPASS_PARAM);
  if (value === "1" || value === "true") {
    try {
      sessionStorage.setItem(PWA_BROWSER_BYPASS_STORAGE, "1");
    } catch {
      /* ignore */
    }
    return true;
  }

  return false;
}

/** Regular mobile/desktop browser — not installed PWA and not Telegram Mini App. */
export function shouldShowPwaInstallGate(): boolean {
  if (typeof window === "undefined") return false;
  if (hasBrowserBypass()) return false;
  if (isTelegramWebApp()) return false;
  if (isStandaloneDisplay()) return false;
  return true;
}
