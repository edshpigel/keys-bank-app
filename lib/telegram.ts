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
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  disableVerticalSwipes?: () => void;
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

export function initTelegramUi() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  tg.ready();
  tg.expand();
  tg.setHeaderColor?.(HEADER_BG);
  tg.setBackgroundColor?.(PAGE_BG);
  tg.setBottomBarColor?.(PAGE_BG);
  tg.disableVerticalSwipes?.();

  const root = document.documentElement;
  root.style.colorScheme = "light only";
  root.style.backgroundColor = PAGE_BG;
  if (document.body) {
    document.body.style.colorScheme = "light only";
    document.body.style.backgroundColor = PAGE_BG;
    document.body.style.color = "#141414";
  }
}
