"use client";

import { Alert, Spinner } from "@heroui/react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { SafeUnitSheet } from "@/components/safe-unit-sheet";
import { api, type PointListItem, type SafeGridItem } from "@/lib/api";
import { useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";
import { isSafeDisabled, safeDotClass, safeStateLabel } from "@/lib/safes";

export default function PointSafesPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const pointId = params.id;
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<SafeGridItem | null>(null);

  const { data: points } = useQuery({
    queryKey: ["operator", "points"],
    queryFn: () => api.get<PointListItem[]>("points"),
  });
  const point = points?.find((p) => p.id === pointId);
  const allowed = new Set(point?.allowed_services ?? ["keys", "luggage"]);
  const hasKeysAccess = !point || allowed.has("keys");

  const { data, isLoading, error } = useQuery({
    queryKey: ["operator", "safes", pointId],
    queryFn: () => api.get<SafeGridItem[]>(`points/${pointId}/safes`),
    enabled: Boolean(pointId) && hasKeysAccess,
  });

  const pointName = point?.name_short || t("pointHub.titleFallback");

  function onActionDone() {
    void queryClient.invalidateQueries({ queryKey: ["operator", "safes", pointId] });
    void queryClient.invalidateQueries({
      queryKey: ["operator", "unit-reservations", selected?.unit_id],
    });
  }

  return (
    <>
      <AppBreadcrumbs
        items={[
          { label: t("nav.points"), href: "/points/" },
          { label: pointName, href: `/point/${pointId}/` },
          { label: t("safes.title") },
        ]}
        backHref={`/point/${pointId}/`}
        backSide="end"
      />
      <div className="flex-1">
        {!hasKeysAccess ? <Alert status="danger">{t("common.accessDenied")}</Alert> : null}

        {hasKeysAccess && isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" className="text-brand-gold" />
          </div>
        ) : null}
        {hasKeysAccess && error ? <Alert status="danger">{t("safes.loadError")}</Alert> : null}

        {hasKeysAccess && !isLoading && !error ? (
          (data ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-text-muted">{t("safes.empty")}</p>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-[7px]">
              {(data ?? []).map((item) => {
                const status = safeStateLabel(item, t);
                const disabled = isSafeDisabled(item);
                return (
                  <li key={item.unit_id}>
                    <button
                      type="button"
                      aria-label={`${t("safes.unitTitle", { label: item.label })} (${status})`}
                      className={cn(
                        "relative flex aspect-square min-h-[52px] w-full items-center justify-center rounded-lg border-[1.5px] border-brand-text bg-white text-sm font-extrabold text-brand-text transition active:scale-[0.97]",
                        disabled && "bg-[#d8d8d8] opacity-70",
                      )}
                      onClick={() => setSelected(item)}
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
                    </button>
                  </li>
                );
              })}
            </ul>
          )
        ) : null}
      </div>

      <SafeUnitSheet
        open={Boolean(selected)}
        safe={selected}
        pointId={pointId}
        onClose={() => setSelected(null)}
        onActionDone={onActionDone}
        onSafeUpdated={(next) => {
          setSelected(next);
          void queryClient.setQueryData<SafeGridItem[]>(["operator", "safes", pointId], (prev) =>
            (prev ?? []).map((row) => (row.unit_id === next.unit_id ? { ...row, ...next } : row)),
          );
        }}
      />
    </>
  );
}
