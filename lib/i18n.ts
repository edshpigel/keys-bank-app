import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import ru from "@/messages/ru.json";

export const LOCALES = ["fr", "en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "kb_app_locale";

export const LOCALE_META: Record<
  Locale,
  { label: string; short: string; flag: string }
> = {
  fr: { label: "Français", short: "FR", flag: "/flags/fr.svg" },
  en: { label: "English", short: "EN", flag: "/flags/en.svg" },
  ru: { label: "Русский", short: "RU", flag: "/flags/ru.svg" },
};

export type Messages = typeof fr;

export const catalogs: Record<Locale, Messages> = {
  fr,
  en: en as Messages,
  ru: ru as Messages,
};

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && (LOCALES as readonly string[]).includes(value));
}

export function resolveLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

function lookup(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = messages;
  for (const part of parts) {
    if (!cur || typeof cur !== "object" || !(part in cur)) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const raw =
    lookup(catalogs[locale], key) ??
    lookup(catalogs[DEFAULT_LOCALE], key) ??
    key;
  if (!params) return raw;
  return Object.entries(params).reduce(
    (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
    raw,
  );
}

/** Russian-friendly booking count label. */
export function formatBookingsCount(
  count: number,
  locale: Locale,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  if (locale !== "ru") return t("clients.bookingsCount", { count });
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return `${count} бронирований`;
  if (n1 === 1) return `${count} бронирование`;
  if (n1 >= 2 && n1 <= 4) return `${count} бронирования`;
  return `${count} бронирований`;
}
