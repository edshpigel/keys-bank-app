"use client";

import { Alert, Spinner } from "@heroui/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { AppHeader } from "@/components/app-header";
import { PageCard } from "@/components/page-card";
import { api, type PointListItem, type SafeGridItem } from "@/lib/api";
import { useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

function safeStateLabel(item: SafeGridItem, t: (k: string) => string) {
  if (item.operational_status === "disabled") return t("safes.disabled");
  if (item.operational_status === "pending_empty") return t("safes.pendingEmpty");
  if (item.busy) return t("safes.busy");
  return t("safes.free");
}

function safeCellClass(item: SafeGridItem) {
  if (item.operational_status === "disabled") {
    return "border-brand-border bg-gray-100 text-brand-text-muted";
  }
  if (item.operational_status === "pending_empty") {
    return "border-amber-300 bg-amber-50 text-amber-900";
  }
  if (item.busy) {
    return "border-red-200 bg-red-50 text-red-900";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-900";
}

export default function PointSafesPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const pointId = params.id;

  const { data: points } = useQuery({
    queryKey: ["operator", "points"],
    queryFn: () => api.get<PointListItem[]>("points"),
  });
  const point = points?.find((p) => p.id === pointId);

  const { data, isLoading, error } = useQuery({
    queryKey: ["operator", "safes", pointId],
    queryFn: () => api.get<SafeGridItem[]>(`points/${pointId}/safes`),
    enabled: Boolean(pointId),
  });

  return (
    <>
      <AppHeader
        title={t("safes.title")}
        subtitle={point?.name_short}
        backHref={`/point/${pointId}/`}
      />
      <PageCard tight className="flex-1">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" className="text-brand-gold" />
          </div>
        ) : null}
        {error ? <Alert status="danger">{t("safes.loadError")}</Alert> : null}

        {!isLoading && !error ? (
          (data ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-text-muted">{t("safes.empty")}</p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {(data ?? []).map((item) => (
                <li key={item.unit_id}>
                  <Link href={`/unit/${item.unit_id}/?point=${pointId}`}>
                    <div
                      className={cn(
                        "flex min-h-[4.5rem] flex-col items-center justify-center rounded-xl border p-2 text-center transition active:scale-[0.98]",
                        safeCellClass(item),
                      )}
                    >
                      <span className="text-base font-semibold">{item.label}</span>
                      <span className="mt-1 text-[10px] uppercase tracking-wide opacity-80">
                        {safeStateLabel(item, t)}
                      </span>
                      {item.is_pmr ? (
                        <span className="mt-0.5 text-[10px] font-medium">{t("safes.pmr")}</span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </PageCard>
    </>
  );
}
