import type { Locale } from "@/lib/i18n";

export function formatDateTime(iso: string, locale: Locale, timeZone?: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

export function formatDateShort(iso: string, locale: Locale, timeZone?: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(date);
}

export function formatTime(iso: string, locale: Locale, timeZone?: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

export function formatDurationHours(startsAt: string, endsAt: string) {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return "";
  const hours = Math.round((end - start) / 3_600_000);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

export function formatCompactMoney(cents: number, locale: Locale) {
  const value = cents / 100;
  if (Math.abs(value) >= 1000) {
    const k = value / 1000;
    const formatted = new Intl.NumberFormat(locale, {
      maximumFractionDigits: k >= 10 ? 0 : 1,
    }).format(k);
    return `€${formatted}K`;
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMoney(cents: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function clientInitials(firstName?: string | null, lastName?: string | null, email?: string) {
  const a = (firstName || "").trim();
  const b = (lastName || "").trim();
  if (a || b) return `${a.charAt(0)}${b.charAt(0)}`.toUpperCase() || a.slice(0, 2).toUpperCase();
  return (email || "?").slice(0, 2).toUpperCase();
}

export function clientDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  email?: string,
) {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || email || "—";
}
