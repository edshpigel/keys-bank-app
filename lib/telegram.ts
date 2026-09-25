type TelegramInset = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type TelegramWebApp = {
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  ready: () => void;
  expand: () => void;
  close: () => void;
  platform?: string;
  version?: string;
  colorScheme?: "light" | "dark";
  themeParams?: Record<string, string>;
  viewportStableHeight?: number;
  safeAreaInset?: TelegramInset;
  contentSafeAreaInset?: TelegramInset;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  disableVerticalSwipes?: () => void;
  onEvent?: (eventType: string, handler: () => void) => void;
  offEvent?: (eventType: string, handler: () => void) => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

const TELEGRAM_ENV_STORAGE = "kb_app_telegram_env";

function hasTelegramLaunchParams(): boolean {
  const hash = window.location.hash || "";
  const search = window.location.search || "";
  return /tgWebApp(?:Data|Version|Platform|ThemeParams)/.test(hash + search);
}

function rememberTelegramEnv(): void {
  try {
    sessionStorage.setItem(TELEGRAM_ENV_STORAGE, "1");
  } catch {
    /* ignore */
  }
}

function rememberedTelegramEnv(): boolean {
  try {
    return sessionStorage.getItem(TELEGRAM_ENV_STORAGE) === "1";
  } catch {
    return false;
  }
}

/** Mini App / Telegram WebView — including before initData is parsed or after hash is cleared. */
export function isTelegramWebApp(): boolean {
  if (typeof window === "undefined") return false;

  if (rememberedTelegramEnv()) return true;

  const tg = window.Telegram?.WebApp;
  if (tg?.initData) {
    rememberTelegramEnv();
    return true;
  }

  if (hasTelegramLaunchParams()) {
    rememberTelegramEnv();
    return true;
  }

  const platform = tg?.platform;
  if (platform && platform !== "unknown") {
    rememberTelegramEnv();
    return true;
  }

  // Telegram client WebViews (Mini App and in-app browser opened from the bot).
  if (/Telegram/i.test(window.navigator.userAgent)) {
    rememberTelegramEnv();
    return true;
  }

  return false;
}

export function getTelegramInitData(): string {
  if (typeof window === "undefined") return "";
  return window.Telegram?.WebApp?.initData || "";
}

const PAGE_BG = "#d1b07a";
const HEADER_BG = "#1a1a1a";
/** Fallback when Telegram reports 0 insets (expanded Mini App under chrome). */
const TG_TOP_FALLBACK_PX = 56;

let telegramSafeAreaBound = false;

function setInsetVar(root: HTMLElement, name: string, value: number | undefined) {
  root.style.setProperty(name, `${Math.max(0, value ?? 0)}px`);
}

function syncTelegramSafeArea(tg: TelegramWebApp) {
  const root = document.documentElement;
  const sa = tg.safeAreaInset;
  const csa = tg.contentSafeAreaInset;

  setInsetVar(root, "--tg-safe-area-inset-top", sa?.top);
  setInsetVar(root, "--tg-safe-area-inset-bottom", sa?.bottom);
  setInsetVar(root, "--tg-safe-area-inset-left", sa?.left);
  setInsetVar(root, "--tg-safe-area-inset-right", sa?.right);
  setInsetVar(root, "--tg-content-safe-area-inset-top", csa?.top);
  setInsetVar(root, "--tg-content-safe-area-inset-bottom", csa?.bottom);
  setInsetVar(root, "--tg-content-safe-area-inset-left", csa?.left);
  setInsetVar(root, "--tg-content-safe-area-inset-right", csa?.right);

  const reportedTop = (sa?.top ?? 0) + (csa?.top ?? 0);
  root.style.setProperty(
    "--kb-tg-top-fallback",
    reportedTop > 0 ? "0px" : `${TG_TOP_FALLBACK_PX}px`,
  );

  if (tg.viewportStableHeight) {
    root.style.setProperty("--tg-viewport-stable-height", `${tg.viewportStableHeight}px`);
  }
}

function bindTelegramSafeArea(tg: TelegramWebApp) {
  if (telegramSafeAreaBound) return;
  telegramSafeAreaBound = true;
  const sync = () => syncTelegramSafeArea(tg);
  tg.onEvent?.("safeAreaChanged", sync);
  tg.onEvent?.("contentSafeAreaChanged", sync);
  tg.onEvent?.("viewportChanged", sync);
  tg.onEvent?.("fullscreenChanged", sync);
}

export function initTelegramUi() {
  if (!isTelegramWebApp()) return;

  const root = document.documentElement;
  root.classList.add("kb-tg");

  const tg = window.Telegram?.WebApp;
  if (!tg) {
    // Detected Telegram env before SDK is ready — still reserve chrome space.
    root.style.setProperty("--kb-tg-top-fallback", `${TG_TOP_FALLBACK_PX}px`);
    return;
  }

  tg.ready();
  tg.expand();
  tg.setHeaderColor?.(HEADER_BG);
  tg.setBackgroundColor?.(PAGE_BG);
  tg.setBottomBarColor?.(PAGE_BG);
  tg.disableVerticalSwipes?.();

  syncTelegramSafeArea(tg);
  bindTelegramSafeArea(tg);

  root.style.colorScheme = "light only";
  root.style.backgroundColor = PAGE_BG;
  if (document.body) {
    document.body.style.colorScheme = "light only";
    document.body.style.backgroundColor = PAGE_BG;
    document.body.style.color = "#141414";
  }
}
