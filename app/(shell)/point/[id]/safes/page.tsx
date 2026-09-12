"use client";

import { Alert, Spinner } from "@heroui/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { AppHeader } from "@/components/app-header";
import { api, type PointListItem, type SafeGridItem } from "@/lib/api";
import { useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

function safeDotClass(item: SafeGridItem) {
  if (item.operational_status === "disabled" || !item) {
    return "bg-[#9a9a9a]";
  }
  if (item.operational_status === "pending_empty") {
    return "bg-[#e8a020]";
  }
  if (item.busy) {
    return "bg-[#e14343]";
  }
  return "bg-[#2fb45a]";
}

function safeAriaLabel(item: SafeGridItem, t: (k: string) => string) {
  if (item.operational_status === "disabled") return t("safes.disabled");
  if (item.operational_status === "pending_empty") return t("safes.pendingEmpty");
  if (item.busy) return t("safes.busy");
  return t("safes.free");
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
        backSide="end"
        size="lg"
      />
      <div className="flex-1">
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
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-[7px]">
              {(data ?? []).map((item) => {
                const status = safeAriaLabel(item, t);
                const disabled = item.operational_status === "disabled";
                return (
                  <li key={item.unit_id}>
                    <Link
                      href={`/unit/${item.unit_id}/?point=${pointId}`}
                      aria-label={`${t("safes.unitTitle", { label: item.label })} (${status})`}
                      className={cn(
                        "relative flex aspect-square min-h-[52px] w-full items-center justify-center rounded-lg border-[1.5px] border-brand-text bg-white text-sm font-extrabold text-brand-text transition active:scale-[0.97]",
                        disabled && "opacity-70",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute right-1.5 top-1.5 h-[9px] w-[9px] rounded-full shadow-[0_0_0_1.5px_#141414]",
                          safeDotClass(item),
                        )}
                        aria-hidden
                      />
                      <span className={cn(disabled && "text-brand-text-muted")}>{item.label}</span>
                      {item.is_pmr ? (
                        <span className="absolute bottom-1 left-0 right-0 text-center text-[8px] font-semibold text-brand-text-muted">
                          {t("safes.pmr")}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )
        ) : null}
      </div>
    </>
  );
}
