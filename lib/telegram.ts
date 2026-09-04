export type TelegramWebApp = {
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  ready: () => void;
  expand: () => void;
  close: () => void;
  platform?: string;
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

export function isTelegramWebApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.Telegram?.WebApp?.initData);
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
