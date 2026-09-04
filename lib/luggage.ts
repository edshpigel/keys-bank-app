import type { LuggageGridItem } from "@/lib/api";

export function luggageStateLabel(item: LuggageGridItem, t: (k: string) => string): string {
  const stateno = String(item.api_stateno ?? "").trim();
  if (stateno === "1") return t("luggage.free");
  if (stateno === "2") return t("luggage.busy");
  if (stateno === "3") return t("luggage.reserved");
  if (item.busy) return t("luggage.busy");
  return t("luggage.free");
}

export function luggageCellClass(item: LuggageGridItem): string {
  const stateno = String(item.api_stateno ?? "").trim();
  if (stateno === "2" || item.busy) {
    return "border-red-200 bg-red-50 text-red-900";
  }
  if (stateno === "3") {
    return "border-amber-300 bg-amber-50 text-amber-900";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-900";
}

export function canOccupyLocker(item: LuggageGridItem): boolean {
  const stateno = String(item.api_stateno ?? "").trim();
  return !item.busy && stateno !== "2";
}
