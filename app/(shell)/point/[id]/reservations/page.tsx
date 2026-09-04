"use client";

import { Alert, Spinner } from "@heroui/react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppHeader } from "@/components/app-header";
import { PageCard } from "@/components/page-card";
import { ReservationCard } from "@/components/reservation-card";
import { ReservationListFilters } from "@/components/reservation-list-filters";
import { api, type PointListItem, type ReservationListItem } from "@/lib/api";
import { filterReservations, type ReservationFilters } from "@/lib/reservations";
import { useT } from "@/lib/i18n-provider";

export default function PointReservationsPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const pointId = params.id;

  const [filters, setFilters] = useState<ReservationFilters>({
    service: "all",
    status: "all",
    query: "",
  });

  const { data: points } = useQuery({
    queryKey: ["operator", "points"],
    queryFn: () => api.get<PointListItem[]>("points"),
  });
  const point = points?.find((p) => p.id === pointId);

  const apiStatus =
    filters.status === "overstay" || filters.status === "active" || filters.status === "expired"
      ? filters.status
      : undefined;

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["operator", "reservations", pointId, apiStatus],
    queryFn: () =>
      api.get<ReservationListItem[]>(`points/${pointId}/reservations`, {
        status: apiStatus ?? "all",
      }),
    enabled: Boolean(pointId),
  });

  const items = useMemo(
    () => filterReservations(data ?? [], filters),
    [data, filters],
  );

  return (
    <>
      <AppHeader
        title={t("reservations.title")}
        subtitle={point?.name_short}
        backHref={`/point/${pointId}/`}
      />
      <PageCard tight className="flex-1 space-y-4">
        <ReservationListFilters value={filters} onChange={setFilters} />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" className="text-brand-gold" />
          </div>
        ) : null}

        {error ? (
          <Alert status="danger">{t("reservations.loadError")}</Alert>
        ) : null}

        {!isLoading && !error ? (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <ReservationCard
                  item={item}
                  pointId={pointId}
                  timeZone={point?.timezone}
                />
              </li>
            ))}
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-brand-text-muted">
                {t("reservations.empty")}
              </p>
            ) : null}
          </ul>
        ) : null}

        {isFetching && !isLoading ? (
          <p className="text-center text-xs text-brand-text-muted">{t("common.loading")}</p>
        ) : null}
      </PageCard>
    </>
  );
}
