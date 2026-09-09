import type { ReservationListItem } from "@/lib/api";

export type ReservationFilters = {
  service: "all" | "keys" | "luggage";
  status: "all" | "active" | "expired" | "overstay";
  query: string;
};

export type DatePreset = "today" | "week" | "month" | "custom";

export type DateRangeFilter = {
  preset: DatePreset;
  /** Inclusive day bounds in point local calendar if possible; ISO date YYYY-MM-DD */
  from: string;
  to: string;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function toIsoDay(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildDateRange(preset: DatePreset, anchor = new Date()): DateRangeFilter {
  const today = startOfDay(anchor);
  if (preset === "today") {
    return { preset, from: toIsoDay(today), to: toIsoDay(today) };
  }
  if (preset === "week") {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { preset, from: toIsoDay(from), to: toIsoDay(today) };
  }
  if (preset === "month") {
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    return { preset, from: toIsoDay(from), to: toIsoDay(today) };
  }
  return { preset: "custom", from: toIsoDay(today), to: toIsoDay(today) };
}

function overlapsRange(item: ReservationListItem, range: DateRangeFilter) {
  const start = new Date(item.starts_at).getTime();
  const end = new Date(item.ends_at).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return true;
  const from = startOfDay(new Date(`${range.from}T00:00:00`)).getTime();
  const to = endOfDay(new Date(`${range.to}T00:00:00`)).getTime();
  return start <= to && end >= from;
}

export function filterReservations(
  items: ReservationListItem[],
  filters: ReservationFilters,
  dateRange?: DateRangeFilter,
): ReservationListItem[] {
  const q = filters.query.trim().toLowerCase();
  return items.filter((item) => {
    if (dateRange && !overlapsRange(item, dateRange)) return false;
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
    const name = `${item.first_name || ""} ${item.last_name || ""}`;
    const hay =
      `${item.public_id} ${item.email} ${item.phone_e164 || ""} ${name} ${item.safe_label || ""}`.toLowerCase();
    return hay.includes(q);
  });
}

export function reservationStats(items: ReservationListItem[]) {
  const total = items.length;
  const active = items.filter(
    (i) =>
      i.status === "confirmed" &&
      (i.lifecycle === "upcoming" || i.lifecycle === "active" || i.lifecycle === "overstay"),
  ).length;
  const revenue = items.reduce((sum, i) => sum + (i.amount_ttc_cents || 0), 0);
  return { total, active, revenue };
}

export type StatusVisual = {
  labelKey: string;
  tone: "success" | "danger" | "warning" | "neutral" | "info" | "gold";
};

export function reservationStatusVisual(item: {
  lifecycle: string;
  takeout_at?: string | null;
  service_type?: string;
}): StatusVisual {
  if (item.lifecycle === "overstay") {
    return {
      labelKey:
        item.service_type === "luggage"
          ? "reservation.statusOverdueDropoff"
          : "reservation.statusOverdue",
      tone: "danger",
    };
  }
  if (item.takeout_at) {
    return { labelKey: "reservation.statusTakenOut", tone: "success" };
  }
  if (item.lifecycle === "active") {
    if (item.service_type === "luggage") {
      return { labelKey: "reservation.statusInStorage", tone: "info" };
    }
    return { labelKey: "lifecycle.active", tone: "success" };
  }
  if (item.lifecycle === "upcoming") {
    return { labelKey: "lifecycle.upcoming", tone: "gold" };
  }
  if (item.lifecycle === "completed") {
    return { labelKey: "lifecycle.completed", tone: "neutral" };
  }
  if (item.lifecycle === "cancelled") {
    return { labelKey: "lifecycle.cancelled", tone: "warning" };
  }
  return { labelKey: `lifecycle.${item.lifecycle}`, tone: "neutral" };
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
