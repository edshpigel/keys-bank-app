"use client";

import { Alert, Button, Spinner } from "@heroui/react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AppHeader } from "@/components/app-header";
import { PageCard } from "@/components/page-card";
import { LuggageLockSheet } from "@/components/luggage-lock-sheet";
import { api, type LuggageGridItem, type PointListItem } from "@/lib/api";
import { luggageCellClass, luggageStateLabel } from "@/lib/luggage";
import { useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

export default function PointLuggagePage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const pointId = params.id;
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<LuggageGridItem | null>(null);

  const { data: points } = useQuery({
    queryKey: ["operator", "points"],
    queryFn: () => api.get<PointListItem[]>("points"),
  });
  const point = points?.find((p) => p.id === pointId);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["operator", "luggage", pointId],
    queryFn: () => api.get<LuggageGridItem[]>(`points/${pointId}/luggage-locks`),
    enabled: Boolean(pointId),
  });

  function onActionDone() {
    void queryClient.invalidateQueries({ queryKey: ["operator", "luggage", pointId] });
    void queryClient.invalidateQueries({ queryKey: ["operator", "lock-actions", pointId] });
  }

  return (
    <>
      <AppHeader
        title={t("luggage.title")}
        subtitle={point?.name_short}
        backHref={`/point/${pointId}/`}
      />
      <PageCard tight className="flex-1">
        <div className="mb-4 flex justify-end">
          <Button
            variant="secondary"
            className="h-9 px-4 text-sm"
            isDisabled={isFetching}
            onPress={() => void refetch()}
          >
            {isFetching ? t("common.loading") : t("luggage.refresh")}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" className="text-brand-gold" />
          </div>
        ) : null}
        {error ? <Alert status="danger">{t("luggage.loadError")}</Alert> : null}

        {!isLoading && !error ? (
          (data ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-text-muted">{t("luggage.empty")}</p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {(data ?? []).map((item) => (
                <li key={item.unit_id}>
                  <button
                    type="button"
                    className={cn(
                      "flex min-h-[4.25rem] w-full flex-col items-center justify-center rounded-xl border p-2 text-center transition active:scale-[0.98]",
                      luggageCellClass(item),
                    )}
                    onClick={() => setSelected(item)}
                  >
                    <span className="text-base font-semibold">{item.label}</span>
                    <span className="mt-1 text-[10px] uppercase tracking-wide opacity-80">
                      {luggageStateLabel(item, t)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </PageCard>

      <LuggageLockSheet
        open={Boolean(selected)}
        lock={selected}
        pointId={pointId}
        timeZone={point?.timezone}
        onClose={() => setSelected(null)}
        onActionDone={onActionDone}
      />
    </>
  );
}
