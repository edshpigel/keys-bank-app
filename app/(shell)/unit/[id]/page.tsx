"use client";

import { Alert, Button, Spinner } from "@heroui/react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppHeader } from "@/components/app-header";
import { PageCard } from "@/components/page-card";
import { ApiError, api, type PointListItem, type UnitReservationItem } from "@/lib/api";
import { useT } from "@/lib/i18n-provider";

function UnitDetailInner() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const pointId = searchParams.get("point") || "";
  const unitId = params.id;
  const queryClient = useQueryClient();

  const { data: points } = useQuery({
    queryKey: ["operator", "points"],
    queryFn: () => api.get<PointListItem[]>("points"),
  });
  const point = points?.find((p) => p.id === pointId);

  const { data: safes } = useQuery({
    queryKey: ["operator", "safes", pointId],
    queryFn: () => api.get<Array<{ unit_id: string; label: string; operational_status: string }>>(`points/${pointId}/safes`),
    enabled: Boolean(pointId),
  });
  const unit = safes?.find((s) => s.unit_id === unitId);

  const { data, isLoading, error } = useQuery({
    queryKey: ["operator", "unit-reservations", unitId],
    queryFn: () => api.get<UnitReservationItem[]>(`units/${unitId}/reservations`),
    enabled: Boolean(unitId),
  });

  const markEmpty = useMutation({
    mutationFn: () => api.post(`units/${unitId}/mark-empty`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["operator", "safes", pointId] });
      void queryClient.invalidateQueries({ queryKey: ["operator", "unit-reservations", unitId] });
    },
  });

  const backHref = pointId ? `/point/${pointId}/safes/` : "/points/";
  const label = unit?.label || unitId.slice(0, 8);

  return (
    <>
      <AppHeader
        title={t("safes.unitTitle", { label })}
        subtitle={point?.name_short}
        backHref={backHref}
      />
      <PageCard tight className="flex-1 space-y-4">
        {unit?.operational_status === "pending_empty" ? (
          <Button
            variant="primary"
            className="w-full bg-brand-gold text-white"
            isDisabled={markEmpty.isPending}
            onPress={() => markEmpty.mutate()}
          >
            {markEmpty.isPending ? t("common.loading") : t("safes.markEmpty")}
          </Button>
        ) : null}

        {markEmpty.isSuccess ? (
          <Alert status="accent">{t("safes.markEmptyDone")}</Alert>
        ) : null}
        {markEmpty.isError ? (
          <Alert status="danger">
            {markEmpty.error instanceof ApiError
              ? markEmpty.error.message
              : t("common.loadError")}
          </Alert>
        ) : null}

        <h2 className="text-sm font-semibold text-brand-text-muted">{t("safes.reservations")}</h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="text-brand-gold" />
          </div>
        ) : null}
        {error ? <Alert status="danger">{t("common.loadError")}</Alert> : null}

        {!isLoading && !error ? (
          <ul className="space-y-2">
            {(data ?? []).map((row) => (
              <li key={row.id}>
                <Link
                  href={`/reservation/${row.id}/?point=${pointId}`}
                  className="block rounded-xl border border-brand-border bg-white p-3 active:scale-[0.99]"
                >
                  <div className="font-semibold">#{row.public_id}</div>
                  <div className="text-sm capitalize text-brand-text-muted">
                    {row.service_type} · {t(`lifecycle.${row.lifecycle}`)}
                  </div>
                  <div className="mt-1 text-xs text-brand-text-muted">
                    {t(`status.${row.status}`)}
                  </div>
                </Link>
              </li>
            ))}
            {(data ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-brand-text-muted">{t("common.empty")}</p>
            ) : null}
          </ul>
        ) : null}
      </PageCard>
    </>
  );
}

export default function UnitDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50dvh] items-center justify-center">
          <Spinner className="text-brand-gold" />
        </div>
      }
    >
      <UnitDetailInner />
    </Suspense>
  );
}
