"use client";

import { Alert, Spinner } from "@heroui/react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppHeader } from "@/components/app-header";
import { PaymentCard } from "@/components/payment-card";
import { PaymentListFilters } from "@/components/payment-list-filters";
import { api, type PaymentListItem, type PointListItem, type ReservationListItem } from "@/lib/api";
import { filterPayments, type PaymentFilters } from "@/lib/payments";
import { useT } from "@/lib/i18n-provider";

export default function PointPaymentsPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const pointId = params.id;

  const [filters, setFilters] = useState<PaymentFilters>({
    kind: "all",
    status: "all",
    query: "",
  });

  const { data: points } = useQuery({
    queryKey: ["operator", "points"],
    queryFn: () => api.get<PointListItem[]>("points"),
  });
  const point = points?.find((p) => p.id === pointId);

  const { data: reservations } = useQuery({
    queryKey: ["operator", "reservations-all", pointId],
    queryFn: () => api.get<ReservationListItem[]>(`points/${pointId}/reservations`, { status: "all" }),
    enabled: Boolean(pointId),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["operator", "payments", pointId],
    queryFn: () => api.get<PaymentListItem[]>(`points/${pointId}/payments`),
    enabled: Boolean(pointId),
  });

  const reservationMap = useMemo(
    () => new Map((reservations ?? []).map((r) => [r.id, r])),
    [reservations],
  );

  const items = useMemo(
    () => filterPayments(data ?? [], reservations ?? [], filters),
    [data, reservations, filters],
  );

  return (
    <>
      <AppHeader
        title={t("payments.title")}
        subtitle={point?.name_short}
        backHref={`/point/${pointId}/`}
        backSide="end"
        size="lg"
      />

      <PaymentListFilters value={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-brand-gold" />
        </div>
      ) : null}

      {error ? <Alert status="danger">{t("payments.loadError")}</Alert> : null}

      {!isLoading && !error ? (
        <ul className="space-y-2.5">
          {items.map((payment) => (
            <li key={payment.id}>
              <PaymentCard
                payment={payment}
                reservation={reservationMap.get(payment.reservation_id)}
                pointId={pointId}
              />
            </li>
          ))}
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-text-muted">{t("payments.empty")}</p>
          ) : null}
        </ul>
      ) : null}
    </>
  );
}
