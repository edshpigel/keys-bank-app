import type { SafeGridItem } from "@/lib/api";

/** Off for new bookings: is_active=false and/or operational_status=disabled. */
export function isSafeDisabled(item: SafeGridItem): boolean {
  return item.is_active === false || item.operational_status === "disabled";
}

export function safeStateLabel(item: SafeGridItem, t: (k: string) => string): string {
  if (isSafeDisabled(item)) return t("safes.disabled");
  if (item.busy) return t("safes.busy");
  if (item.operational_status === "pending_empty") return t("safes.pendingEmpty");
  return t("safes.free");
}

/** Dot colors: disabled grey / busy red / free green. */
export function safeDotClass(item: SafeGridItem): string {
  if (isSafeDisabled(item)) return "bg-[#9a9a9a]";
  if (item.busy) return "bg-[#e14343]";
  return "bg-[#2fb45a]";
}
