import type { ReservationListItem } from "@/lib/api";

export type ReservationFilters = {
  service: "all" | "keys" | "luggage";
  status: "all" | "active" | "expired" | "overstay";
  query: string;
};

export function filterReservations(
  items: ReservationListItem[],
  filters: ReservationFilters,
): ReservationListItem[] {
  const q = filters.query.trim().toLowerCase();
  return items.filter((item) => {
    if (filters.service !== "all" && item.service_type !== filters.service) {
      return false;
    }
    if (filters.status === "overstay" && item.lifecycle !== "overstay") {
      return false;
    }
    if (filters.status === "active") {
      const active =
        item.lifecycle === "upcoming" ||
        item.lifecycle === "active" ||
        item.lifecycle === "overstay";
      if (!active || item.status !== "confirmed") return false;
    }
    if (filters.status === "expired") {
      const expired =
        item.lifecycle === "completed" ||
        item.lifecycle === "cancelled" ||
        ["expired", "cancelled", "refunded"].includes(item.status);
      if (!expired) return false;
    }
    if (!q) return true;
    const hay = `${item.public_id} ${item.email} ${item.safe_label || ""}`.toLowerCase();
    return hay.includes(q);
  });
}

export function lifecycleChipColor(lifecycle: string): "success" | "warning" | "danger" | "default" {
  switch (lifecycle) {
    case "active":
    case "upcoming":
      return "success";
    case "overstay":
      return "danger";
    case "completed":
      return "default";
    case "cancelled":
      return "warning";
    default:
      return "default";
  }
}
