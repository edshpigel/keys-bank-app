import type { LuggageGridItem } from "@/lib/api";

export function luggageStateLabel(item: LuggageGridItem, t: (k: string) => string): string {
  const stateno = String(item.api_stateno ?? "").trim();
  if (stateno === "1") return t("luggage.free");
  if (stateno === "2") return t("luggage.busy");
  if (stateno === "3") return t("luggage.reserved");
  if (item.busy) return t("luggage.busy");
  return t("luggage.free");
}

/** Dot colors match lk-keysbank: 1 green / 2 amber / 3 red. */
export function luggageDotClass(item: LuggageGridItem): string {
  const stateno = String(item.api_stateno ?? "").trim();
  if (stateno === "1") return "bg-[#2fb45a]";
  if (stateno === "2") return "bg-[#e8a020]";
  if (stateno === "3") return "bg-[#e14343]";
  if (item.busy) return "bg-[#e14343]";
  return "bg-[#9aa0a6]";
}

export function canOccupyLocker(item: LuggageGridItem): boolean {
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
