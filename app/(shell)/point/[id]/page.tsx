"use client";

import { Alert, Spinner } from "@heroui/react";
import { BarChart3, CalendarDays, CreditCard, Lock, Luggage } from "lucide-react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { MenuLink } from "@/components/menu-link";
import { SoftCard } from "@/components/ui/soft-card";
import { api, type DashboardSummary, type PointListItem } from "@/lib/api";
import { useT } from "@/lib/i18n-provider";

export default function PointHubPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const pointId = params.id;

  const { data: points } = useQuery({
    queryKey: ["operator", "points"],
    queryFn: () => api.get<PointListItem[]>("points"),
  });
  const point = points?.find((p) => p.id === pointId);
  const allowed = new Set(point?.allowed_services ?? ["keys", "luggage"]);
  const hasAnyService = allowed.size > 0;

  const sections = [
    {
      key: "reservations",
      label: t("pointHub.sections.reservations"),
      href: `/point/${pointId}/reservations/`,
      icon: CalendarDays,
      visible: hasAnyService,
    },
    {
      key: "payments",
      label: t("pointHub.sections.payments"),
      href: `/point/${pointId}/payments/`,
      icon: CreditCard,
      visible: hasAnyService,
    },
    {
      key: "safes",
      label: t("pointHub.sections.safes"),
      href: `/point/${pointId}/safes/`,
      icon: Lock,
      visible: allowed.has("keys"),
    },
    {
      key: "luggage",
      label: t("pointHub.sections.luggage"),
      href: `/point/${pointId}/luggage/`,
      icon: Luggage,
      visible: allowed.has("luggage"),
    },
    {
      key: "statistics",
      label: t("pointHub.sections.statistics"),
      href: `/point/${pointId}/statistics/`,
      icon: BarChart3,
      visible: hasAnyService,
    },
  ].filter((section) => section.visible);

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ["operator", "dashboard", pointId],
    queryFn: () => api.get<DashboardSummary>("dashboard", { point_id: pointId }),
    enabled: Boolean(pointId),
  });

  const stats = dashboard
    ? [
        { label: t("pointHub.stats.active"), value: dashboard.active },
        { label: t("pointHub.stats.overstay"), value: dashboard.overstay },
        { label: t("pointHub.stats.provisioning"), value: dashboard.provisioning_failed },
        { label: t("pointHub.stats.pendingEmpty"), value: dashboard.pending_empty },
      ]
    : [];

  const pointName = point?.name_short || t("pointHub.titleFallback");

  return (
    <>
      <AppBreadcrumbs
        items={[
          { label: t("nav.points"), href: "/points/" },
          { label: pointName },
        ]}
        backHref="/points/"
        backSide="end"
      />

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner className="text-brand-gold" />
        </div>
      ) : null}
      {error ? <Alert status="danger">{t("pointHub.dashboardError")}</Alert> : null}

      {stats.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          {stats.map((item) => (
            <SoftCard key={item.label} padding="sm">
              <div className="text-xl font-bold tabular-nums text-brand-text">{item.value}</div>
              <div className="text-[11px] text-brand-text-muted">{item.label}</div>
            </SoftCard>
          ))}
        </div>
      ) : null}

      {!hasAnyService ? <Alert status="danger">{t("common.accessDenied")}</Alert> : null}

      <nav className="flex flex-col gap-2.5" aria-label="Point sections">
        {sections.map((section) => (
          <MenuLink
            key={section.key}
            href={section.href}
            label={section.label}
            icon={section.icon}
          />
        ))}
      </nav>
    </>
  );
}
