import type { LuggageGridItem } from "@/lib/api";

export function isLuggageDisabled(item: LuggageGridItem): boolean {
  return item.is_active === false || item.operational_status === "disabled";
}

export function luggageStateLabel(item: LuggageGridItem, t: (k: string) => string): string {
  if (isLuggageDisabled(item)) return t("luggage.disabled");
  if (item.operational_status === "reserved") return t("luggage.reserved");
  const stateno = String(item.api_stateno ?? "").trim();
  if (stateno === "1") return t("luggage.free");
  if (stateno === "2") return t("luggage.busy");
  if (stateno === "3") return t("luggage.busy");
  if (item.busy) return t("luggage.busy");
  return t("luggage.free");
}

/** Dot colors: disabled grey / reserved gold / 1 green / 2 amber / 3 red. */
export function luggageDotClass(item: LuggageGridItem): string {
  if (isLuggageDisabled(item)) return "bg-[#9a9a9a]";
  if (item.operational_status === "reserved") return "bg-brand-gold";
  const stateno = String(item.api_stateno ?? "").trim();
  if (stateno === "1") return "bg-[#2fb45a]";
  if (stateno === "2") return "bg-[#e8a020]";
  if (stateno === "3") return "bg-[#e14343]";
  if (item.busy) return "bg-[#e14343]";
  return "bg-[#9aa0a6]";
}

export function canOccupyLocker(item: LuggageGridItem): boolean {
  if (isLuggageDisabled(item)) return false;
  if (item.operational_status === "reserved") return false;
  const stateno = String(item.api_stateno ?? "").trim();
  return !item.busy && stateno !== "2" && stateno !== "3";
}

export function luggageHistoryLabel(
  action: string,
  t: (k: string, vars?: Record<string, string | number>) => string,
  publicId?: string | null,
): string {
  const key = (action || "").trim().toLowerCase();
  if (key === "occupy") return t("luggage.historyOccupied");
  if (key === "open" || key === "unlock") {
    if (publicId) return t("luggage.historyOpened", { id: publicId });
    return t("luggage.historyOpenedGeneric");
  }
  if (key === "clear" || key === "takeout" || key === "take_out") {
    return t("luggage.historyTakenOut");
  }
  return action;
}
