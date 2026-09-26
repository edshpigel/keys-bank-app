"use client";

import type { ReactNode } from "react";
import { Alert, Spinner } from "@heroui/react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { ServiceFilterChips, type ServiceFilterValue } from "@/components/service-filter-chips";
import { StatsBarChart, thinSeriesLabels } from "@/components/stats-bar-chart";
import { StatsDonutChart } from "@/components/stats-donut-chart";
import { DateFilterBar } from "@/components/ui/date-filter-bar";
import { api, type PointListItem } from "@/lib/api";
import { formatDateShort, formatMoney } from "@/lib/format";
import { useI18n, useT } from "@/lib/i18n-provider";
import {
  buildDateRange,
  customDateRange,
  type DateRangeFilter,
} from "@/lib/reservations";
import { ShellStickyBar } from "@/lib/shell-sticky";
import {
  fetchPointStatistics,
  type StatisticsService,
} from "@/lib/statistics";

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-brand-border bg-white p-3">
      <p className="text-[11px] text-brand-text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-brand-text">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[14px] border border-brand-border bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-brand-text">{title}</h3>
      {children}
    </div>
  );
}

function resolveStatsRange(range: DateRangeFilter): { from: string; to: string } {
  if (range.from && range.to) return { from: range.from, to: range.to };
  const fallback = buildDateRange("month");
  return { from: fallback.from, to: fallback.to };
}

export default function PointStatisticsPage() {
  const t = useT();
  const { locale } = useI18n();
  const params = useParams<{ id: string }>();
  const pointId = params.id;

  const [dateRange, setDateRange] = useState<DateRangeFilter>(() => buildDateRange("month"));
  const [service, setService] = useState<ServiceFilterValue>("all");

  const { data: points } = useQuery({
    queryKey: ["operator", "points"],
    queryFn: () => api.get<PointListItem[]>("points"),
  });
  const point = points?.find((p) => p.id === pointId);
  const allowedServices = useMemo(
    () => point?.allowed_services ?? (["keys", "luggage"] as Array<"keys" | "luggage">),
    [point?.allowed_services],
  );

  useEffect(() => {
    if (allowedServices.length === 1) {
      setService(allowedServices[0]);
      return;
    }
    if (service !== "all" && !allowedServices.includes(service)) {
      setService("all");
    }
  }, [allowedServices, service]);

  const apiRange = useMemo(() => resolveStatsRange(dateRange), [dateRange]);
  const queryFilters = useMemo(
    () => ({
      dateFrom: apiRange.from,
      dateTo: apiRange.to,
      service: service as StatisticsService,
    }),
    [apiRange.from, apiRange.to, service],
  );

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["operator", "statistics", pointId, queryFilters],
    queryFn: () => fetchPointStatistics(pointId, queryFilters),
    enabled: Boolean(pointId) && allowedServices.length > 0,
  });

  const currency = data?.summary.currency ?? "EUR";

  const seriesLabels = useMemo(
    () => thinSeriesLabels(data?.series.labels ?? [], locale, 10),
    [data?.series.labels, locale],
  );

  const serviceItems = useMemo(
    () =>
      data
        ? [
            { key: "keys", count: data.by_service.keys },
            { key: "luggage", count: data.by_service.luggage },
          ].filter((item) => allowedServices.includes(item.key as "keys" | "luggage"))
        : [],
    [data, allowedServices],
  );

  const statusItems = useMemo(
    () =>
      data
        ? [
            { key: "active", count: data.by_status.active },
            { key: "upcoming", count: data.by_status.upcoming },
            { key: "expired", count: data.by_status.expired },
            { key: "refund", count: data.by_status.refund },
          ]
        : [],
    [data],
  );

  const periodItems = useMemo(
    () => (data?.by_period ?? []).map((row) => ({ key: row.period, count: row.count })),
    [data],
  );

  const serviceLabels = useMemo(
    () => ({
      keys: t("stats.serviceKeys"),
      luggage: t("stats.serviceLuggage"),
    }),
    [t],
  );

  const statusLabels = useMemo(
    () => ({
      active: t("lifecycle.active"),
      upcoming: t("lifecycle.upcoming"),
      expired: t("stats.statusExpired"),
      refund: t("stats.refunds"),
    }),
    [t],
  );

  const periodLabels = useMemo(() => {
    const map: Record<string, string> = { unknown: t("stats.periodUnknown") };
    for (const row of data?.by_period ?? []) {
      map[row.period] = row.period;
    }
    return map;
  }, [data?.by_period, t]);

  const dateFromLabel = formatDateShort(`${apiRange.from}T12:00:00`, locale);
  const dateToLabel =
    apiRange.from === apiRange.to ? null : formatDateShort(`${apiRange.to}T12:00:00`, locale);

  const loading = isLoading || isFetching;
  const pointName = point?.name_short || t("pointHub.titleFallback");

  return (
    <>
      <AppBreadcrumbs
        items={[
          { label: t("nav.points"), href: "/points/" },
          { label: pointName, href: `/point/${pointId}/` },
          { label: t("pointHub.sections.statistics") },
        ]}
        backHref={`/point/${pointId}/`}
        backSide="end"
      />

      {allowedServices.length === 0 ? (
        <Alert status="danger">{t("common.accessDenied")}</Alert>
      ) : (
        <>
          <ServiceFilterChips
            value={service}
            onChange={setService}
            allowedServices={allowedServices}
          />

          {loading && !data ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" className="text-brand-gold" />
            </div>
          ) : null}

          {error ? <Alert status="danger">{t("stats.loadError")}</Alert> : null}

          {data ? (
            <div className={loading ? "pointer-events-none space-y-4 opacity-60" : "space-y-4"}>
              <div className="grid grid-cols-2 gap-3">
                <KpiCard label={t("stats.bookings")} value={String(data.summary.bookings)} />
                <KpiCard
                  label={t("stats.revenue")}
                  value={formatMoney(data.summary.revenue_cents, currency, locale)}
                />
                <KpiCard
                  label={t("stats.averageCheck")}
                  value={formatMoney(data.summary.average_check_cents, currency, locale)}
                />
                <KpiCard label={t("stats.activeNow")} value={String(data.summary.active_now)} />
                <KpiCard label={t("stats.renewals")} value={String(data.summary.renewals)} />
                <KpiCard label={t("stats.refunds")} value={String(data.summary.refunds)} />
              </div>

              <ChartCard title={t("stats.chartBookings")}>
                <StatsBarChart labels={seriesLabels} values={data.series.bookings} />
              </ChartCard>

              <ChartCard title={t("stats.chartRevenue")}>
                <StatsBarChart
                  labels={seriesLabels}
                  values={data.series.revenue_cents}
                  barClassName="bg-brand-text/70"
                  formatValue={(cents) => formatMoney(cents, currency, locale)}
                />
              </ChartCard>

              {serviceItems.length > 1 || (serviceItems[0]?.count ?? 0) > 0 ? (
                <ChartCard title={t("stats.chartService")}>
                  <StatsDonutChart
                    items={serviceItems}
                    labels={serviceLabels}
                    center={String(data.summary.bookings)}
                  />
                </ChartCard>
              ) : null}

              <ChartCard title={t("stats.chartStatus")}>
                <StatsDonutChart
                  items={statusItems}
                  labels={statusLabels}
                  center={String(data.summary.bookings)}
                />
              </ChartCard>

              {periodItems.length > 0 ? (
                <ChartCard title={t("stats.chartPeriod")}>
                  <StatsBarChart
                    labels={periodItems.map((i) => periodLabels[i.key] ?? i.key)}
                    values={periodItems.map((i) => i.count)}
                  />
                </ChartCard>
              ) : null}
            </div>
          ) : null}

          <ShellStickyBar>
            <DateFilterBar
              hideAllPreset
              dateFromLabel={dateFromLabel}
              dateToLabel={dateToLabel}
              preset={dateRange.preset === "all" ? "month" : dateRange.preset}
              fromValue={apiRange.from}
              toValue={apiRange.to}
              onPresetChange={(preset) => setDateRange(buildDateRange(preset === "all" ? "month" : preset))}
              onApplyCustomRange={(from, to) => setDateRange(customDateRange(from, to))}
            />
          </ShellStickyBar>
        </>
      )}
    </>
  );
}
