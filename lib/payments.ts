import type { PaymentListItem, ReservationListItem } from "@/lib/api";

export type PaymentFilters = {
  kind: "all" | "initial" | "extend";
  status: "all" | "paid" | "refunded";
  query: string;
};

export function paymentKindGroup(kind: string): "initial" | "extend" {
  return kind === "initial" ? "initial" : "extend";
}

export function filterPayments(
  items: PaymentListItem[],
  reservations: ReservationListItem[],
  filters: PaymentFilters,
): PaymentListItem[] {
  const byId = new Map(reservations.map((r) => [r.id, r]));
  const q = filters.query.trim().toLowerCase();

  return items.filter((payment) => {
    const group = paymentKindGroup(payment.kind);
    if (filters.kind === "initial" && group !== "initial") return false;
    if (filters.kind === "extend" && group !== "extend") return false;
    if (filters.status !== "all" && payment.status !== filters.status) return false;
    if (!q) return true;
    const reservation = byId.get(payment.reservation_id);
    const hay = [
      payment.id,
      payment.tariff_code,
      reservation?.public_id,
      reservation?.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function paymentKindLabel(kind: string, t: (key: string) => string): string {
  return paymentKindGroup(kind) === "initial"
    ? t("payments.kindInitial")
    : t("payments.kindExtend");
}

export function paymentStatusColor(status: string): "success" | "warning" | "default" {
  if (status === "paid") return "success";
  if (status === "refunded") return "warning";
  return "default";
}
