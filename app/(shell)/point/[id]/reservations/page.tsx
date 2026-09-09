"use client";

import { Alert, Spinner } from "@heroui/react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppHeader } from "@/components/app-header";
import { ReservationCard } from "@/components/reservation-card";
import { ReservationListFilters } from "@/components/reservation-list-filters";
import { DateFilterBar } from "@/components/ui/date-filter-bar";
import { SoftCard } from "@/components/ui/soft-card";
import { api, type PointListItem, type ReservationListItem } from "@/lib/api";
import { formatCompactMoney, formatDateShort } from "@/lib/format";
import { useI18n, useT } from "@/lib/i18n-provider";
import {
  buildDateRange,
  customDateRange,
  filterReservations,
  reservationStats,
  type ReservationFilters,
} from "@/lib/reservations";
import { ShellStickyBar } from "@/lib/shell-sticky";

export default function PointReservationsPage() {
  const t = useT();
  const { locale } = useI18n();
  const params = useParams<{ id: string }>();
  const pointId = params.id;

  const [filters, setFilters] = useState<ReservationFilters>({
    service: "all",
    status: "all",
    query: "",
  });
  const [dateRange, setDateRange] = useState(() => buildDateRange("week"));

  const { data: points } = useQuery({
    queryKey: ["operator", "points"],
    queryFn: () => api.get<PointListItem[]>("points"),
  });
  const point = points?.find((p) => p.id === pointId);
  const subtitle = [point?.city, point?.name_short].filter(Boolean).join(", ");

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
    () => filterReservations(data ?? [], filters, dateRange),
    [data, filters, dateRange],
  );

  const stats = useMemo(() => reservationStats(items), [items]);

  const dateFromLabel = formatDateShort(`${dateRange.from}T12:00:00`, locale);
  const dateToLabel =
    dateRange.from === dateRange.to
      ? null
      : formatDateShort(`${dateRange.to}T12:00:00`, locale);

  return (
    <>
      <AppHeader
        title={t("reservations.title")}
        subtitle={subtitle || point?.name_short}
        backHref={`/point/${pointId}/`}
        backSide="end"
        size="lg"
      />

      <ReservationListFilters value={filters} onChange={setFilters} />

      <div className="grid grid-cols-3 gap-2">
        <SoftCard padding="sm" className="flex flex-col gap-1">
          <div className="text-[11px] text-brand-text-muted">{t("reservations.statTotal")}</div>
          <div className="text-xl font-bold tabular-nums text-brand-text">
            {stats.total.toLocaleString(locale)}
          </div>
        </SoftCard>
        <SoftCard padding="sm" className="flex flex-col gap-1">
          <div className="text-[11px] text-brand-text-muted">{t("reservations.statActive")}</div>
          <div className="text-xl font-bold tabular-nums text-brand-text">
            {stats.active.toLocaleString(locale)}
          </div>
        </SoftCard>
        <SoftCard padding="sm" className="flex flex-col gap-1">
          <div className="text-[11px] text-brand-text-muted">{t("reservations.statRevenue")}</div>
          <div className="text-xl font-bold tabular-nums text-brand-text">
            {formatCompactMoney(stats.revenue, locale)}
          </div>
        </SoftCard>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-brand-gold" />
        </div>
      ) : null}

      {error ? <Alert status="danger">{t("reservations.loadError")}</Alert> : null}

      {!isLoading && !error ? (
        <ul className="space-y-2.5 pb-2">
          {items.map((item) => (
            <li key={item.id}>
              <ReservationCard item={item} pointId={pointId} timeZone={point?.timezone} />
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

      <ShellStickyBar>
        <DateFilterBar
          dateFromLabel={dateFromLabel}
          dateToLabel={dateToLabel}
          preset={dateRange.preset}
          fromValue={dateRange.from}
          toValue={dateRange.to}
          onPresetChange={(preset) => setDateRange(buildDateRange(preset))}
          onApplyCustomRange={(from, to) => setDateRange(customDateRange(from, to))}
        />
      </ShellStickyBar>
    </>
  );
}
