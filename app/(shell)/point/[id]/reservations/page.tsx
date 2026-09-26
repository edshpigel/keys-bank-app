"use client";

import { Alert, Spinner } from "@heroui/react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Virtuoso } from "react-virtuoso";

import { AppHeader } from "@/components/app-header";
import { ReservationCard } from "@/components/reservation-card";
import { ReservationListFilters } from "@/components/reservation-list-filters";
import { DateFilterBar } from "@/components/ui/date-filter-bar";
import { SoftCard } from "@/components/ui/soft-card";
import { InfiniteLoadFooter } from "@/components/ui/infinite-load-footer";
import {
  api,
  type PointListItem,
  type ReservationListItem,
  type ReservationsListResponse,
} from "@/lib/api";
import { formatCompactMoney, formatDateShort } from "@/lib/format";
import { useI18n, useT } from "@/lib/i18n-provider";
import {
  buildDateRange,
  customDateRange,
  type ReservationFilters,
} from "@/lib/reservations";
import { ShellStickyBar } from "@/lib/shell-sticky";
import { useVirtuosoLoadMore } from "@/lib/use-virtuoso-load-more";

const PAGE_SIZE = 30;

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
  const [dateRange, setDateRange] = useState(() => buildDateRange("all"));
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(filters.query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [filters.query]);

  const { data: points } = useQuery({
    queryKey: ["operator", "points"],
    queryFn: () => api.get<PointListItem[]>("points"),
  });
  const point = points?.find((p) => p.id === pointId);
  const allowedServices = useMemo(
    () => point?.allowed_services ?? (["keys", "luggage"] as Array<"keys" | "luggage">),
    [point?.allowed_services],
  );
  const subtitle = [point?.city, point?.name_short].filter(Boolean).join(", ");

  useEffect(() => {
    if (filters.service === "all") return;
    if (!allowedServices.includes(filters.service)) {
      setFilters((prev) => ({ ...prev, service: "all" }));
    }
  }, [allowedServices, filters.service]);

  const listQuery = useInfiniteQuery({
    queryKey: [
      "operator",
      "reservations",
      pointId,
      filters.service,
      filters.status,
      debouncedQuery,
      dateRange.preset,
      dateRange.from,
      dateRange.to,
    ],
    queryFn: ({ pageParam }) =>
      api.get<ReservationsListResponse>(`points/${pointId}/reservations`, {
        status: filters.status,
        service: filters.service,
        q: debouncedQuery || undefined,
        date_from: dateRange.from || undefined,
        date_to: dateRange.to || undefined,
        limit: PAGE_SIZE,
        cursor: pageParam || undefined,
      }),
    initialPageParam: "" as string,
    getNextPageParam: (lastPage) =>
      lastPage.has_more && lastPage.next_cursor ? lastPage.next_cursor : undefined,
    enabled: Boolean(pointId),
  });

  const items = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data],
  );

  const stats = useMemo(() => {
    const summary = listQuery.data?.pages.find((page) => page.summary)?.summary;
    if (summary) {
      return {
        total: summary.total,
        active: summary.active,
        revenue: summary.revenue_ttc_cents,
      };
    }
    return { total: 0, active: 0, revenue: 0 };
  }, [listQuery.data]);

  const onEndReached = useVirtuosoLoadMore(
    listQuery.hasNextPage,
    listQuery.isFetchingNextPage,
    listQuery.fetchNextPage,
  );

  const dateFromLabel =
    dateRange.preset === "all"
      ? t("reservations.dateAll")
      : formatDateShort(`${dateRange.from}T12:00:00`, locale);
  const dateToLabel =
    dateRange.preset === "all" || dateRange.from === dateRange.to
      ? null
      : formatDateShort(`${dateRange.to}T12:00:00`, locale);

  const isLoading = listQuery.isLoading;
  const error = listQuery.error;
  const isFetching = listQuery.isFetching && !listQuery.isFetchingNextPage;

  return (
    <>
      <AppHeader
        title={t("reservations.title")}
        subtitle={subtitle || point?.name_short}
        backHref={`/point/${pointId}/`}
        backSide="end"
        size="lg"
      />

      <ReservationListFilters
        value={filters}
        onChange={setFilters}
        allowedServices={allowedServices}
      />

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

      {!isLoading && !error && items.length === 0 ? (
        <p className="py-8 text-center text-sm text-brand-text-muted">{t("reservations.empty")}</p>
      ) : null}

      {!isLoading && !error && items.length > 0 ? (
        <>
          <Virtuoso
            useWindowScroll
            data={items}
            overscan={400}
            increaseViewportBy={{ top: 200, bottom: 400 }}
            endReached={onEndReached}
            computeItemKey={(_index, item: ReservationListItem) => item.id}
            itemContent={(_index, item) => (
              <div className="pb-2.5">
                <ReservationCard item={item} pointId={pointId} timeZone={point?.timezone} />
              </div>
            )}
          />
          <InfiniteLoadFooter
            hasNextPage={Boolean(listQuery.hasNextPage)}
            isFetchingNextPage={listQuery.isFetchingNextPage}
            fetchNextPage={listQuery.fetchNextPage}
          />
        </>
      ) : null}

      {isFetching ? (
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
