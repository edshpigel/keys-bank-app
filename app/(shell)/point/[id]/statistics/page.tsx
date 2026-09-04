"use client";

import { Alert, Spinner } from "@heroui/react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppHeader } from "@/components/app-header";
import { PageCard } from "@/components/page-card";
import { StatsBarChart, thinSeriesLabels } from "@/components/stats-bar-chart";
import { StatsDonutChart } from "@/components/stats-donut-chart";
import { StatsFiltersPanel } from "@/components/stats-filters";
import { api, type PointListItem } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useI18n, useT } from "@/lib/i18n-provider";
import {
  fetchPointStatistics,
  presetRange,
  type StatisticsFilters,
} from "@/lib/statistics";

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-3 shadow-sm">
      <p className="text-xs text-brand-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-brand-text">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-brand-text">{title}</h3>
      {children}
    </div>
  );
}

export default function PointStatisticsPage() {
  const t = useT();
  const { locale } = useI18n();
  const params = useParams<{ id: string }>();
  const pointId = params.id;

  const [activePreset, setActivePreset] = useState<number | null>(30);
  const [filters, setFilters] = useState<StatisticsFilters>(() => ({
    ...presetRange(30),
    service: "all",
  }));
  const [queryFilters, setQueryFilters] = useState(filters);

  const { data: points } = useQuery({
    queryKey: ["operator", "points"],
    queryFn: () => api.get<PointListItem[]>("points"),
  });
  const point = points?.find((p) => p.id === pointId);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["operator", "statistics", pointId, queryFilters],
    queryFn: () => fetchPointStatistics(pointId, queryFilters),
    enabled: Boolean(pointId),
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
          ]
        : [],
    [data],
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
    [data?.by_period],
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

  const applyPreset = (days: number) => {
    const next = { ...filters, ...presetRange(days) };
    setActivePreset(days);
    setFilters(next);
    setQueryFilters(next);
  };

  const applyFilters = () => {
    setActivePreset(null);
    setQueryFilters(filters);
    void refetch();
  };

  const loading = isLoading || isFetching;

  return (
    <>
      <AppHeader
        title={t("pointHub.sections.statistics")}
        subtitle={point?.name_short}
        backHref={`/point/${pointId}/`}
      />
      <PageCard tight className="flex-1 space-y-4 pb-2">
        <StatsFiltersPanel
          value={filters}
          activePreset={activePreset}
          onPreset={applyPreset}
          onChange={(next) => {
            setActivePreset(null);
            setFilters(next);
          }}
          onApply={applyFilters}
          loading={loading}
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

            <ChartCard title={t("stats.chartService")}>
              <StatsDonutChart
                items={serviceItems}
                labels={serviceLabels}
                center={String(data.summary.bookings)}
              />
            </ChartCard>

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
      </PageCard>
    </>
  );
}
