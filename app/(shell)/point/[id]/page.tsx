"use client";

import { Alert, Spinner } from "@heroui/react";
import { BarChart3, CalendarDays, CreditCard, Lock, Luggage } from "lucide-react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { AppHeader } from "@/components/app-header";
import { MenuLink } from "@/components/menu-link";
import { PageCard } from "@/components/page-card";
import { api, type DashboardSummary, type PointListItem } from "@/lib/api";
import { useT } from "@/lib/i18n-provider";

export default function PointHubPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const pointId = params.id;

  const sections = [
    {
      key: "reservations",
      label: t("pointHub.sections.reservations"),
      href: `/point/${pointId}/reservations/`,
      icon: CalendarDays,
    },
    {
      key: "payments",
      label: t("pointHub.sections.payments"),
      href: `/point/${pointId}/payments/`,
      icon: CreditCard,
    },
    {
      key: "safes",
      label: t("pointHub.sections.safes"),
      href: `/point/${pointId}/safes/`,
      icon: Lock,
    },
    {
      key: "luggage",
      label: t("pointHub.sections.luggage"),
      href: `/point/${pointId}/luggage/`,
      icon: Luggage,
    },
    {
      key: "statistics",
      label: t("pointHub.sections.statistics"),
      href: `/point/${pointId}/statistics/`,
      icon: BarChart3,
    },
  ] as const;

  const { data: points } = useQuery({
    queryKey: ["operator", "points"],
    queryFn: () => api.get<PointListItem[]>("points"),
  });
  const point = points?.find((p) => p.id === pointId);

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ["operator", "dashboard"],
    queryFn: () => api.get<DashboardSummary>("dashboard"),
  });

  const stats = dashboard
    ? [
        { label: t("pointHub.stats.active"), value: dashboard.active },
        { label: t("pointHub.stats.overstay"), value: dashboard.overstay },
        { label: t("pointHub.stats.provisioning"), value: dashboard.provisioning_failed },
        { label: t("pointHub.stats.pendingEmpty"), value: dashboard.pending_empty },
      ]
    : [];

  return (
    <>
      <AppHeader
        title={point?.name_short || t("pointHub.titleFallback")}
        subtitle={point?.city}
        backHref="/points/"
      />
      <PageCard tight className="flex-1 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner className="text-brand-gold" />
          </div>
        ) : null}
        {error ? <Alert status="danger">{t("pointHub.dashboardError")}</Alert> : null}

        {stats.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-[14px] border border-black/10 bg-brand-cream/80 px-3 py-2.5"
              >
                <div className="text-xl font-bold tabular-nums text-brand-text">{item.value}</div>
                <div className="text-[11px] text-brand-text-muted">{item.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        <nav className="flex flex-col gap-2" aria-label="Point sections">
          {sections.map((section) => (
            <MenuLink
              key={section.key}
              href={section.href}
              label={section.label}
              icon={section.icon}
            />
          ))}
        </nav>
      </PageCard>
    </>
  );
}
