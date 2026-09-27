"use client";

import { Button, Spinner, Switch } from "@heroui/react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ApiError, api, type SafeGridItem, type UnitReservationItem } from "@/lib/api";
import { idempotencyKey } from "@/lib/idempotency";
import { useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";
import { isSafeDisabled, safeStateLabel } from "@/lib/safes";

type Props = {
  open: boolean;
  safe: SafeGridItem | null;
  pointId: string;
  onClose: () => void;
  onActionDone: () => void;
  onSafeUpdated?: (next: SafeGridItem) => void;
};

export function SafeUnitSheet({
  open,
  safe,
  pointId,
  onClose,
  onActionDone,
  onSafeUpdated,
}: Props) {
  const t = useT();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [editPmr, setEditPmr] = useState(false);
  const [editDisabled, setEditDisabled] = useState(false);
  const [cached, setCached] = useState<SafeGridItem | null>(safe);

  useEffect(() => {
    if (safe) setCached(safe);
  }, [safe]);

  useEffect(() => {
    if (!open || !safe) return;
    setMessage(null);
    setEditPmr(Boolean(safe.is_pmr));
    setEditDisabled(isSafeDisabled(safe));
  }, [open, safe]);

  const active = safe ?? cached;

  const { data: unitOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["operator", "unit-reservations", active?.unit_id],
    queryFn: () => api.get<UnitReservationItem[]>(`units/${active!.unit_id}/reservations`),
    enabled: open && Boolean(active?.unit_id),
  });

  const settingsMutation = useMutation({
    mutationFn: async (next: { is_pmr: boolean; disabled: boolean }) => {
      if (!active) throw new Error("no_safe");
      return api.patch<{
        is_pmr: boolean;
        is_active: boolean;
        operational_status: string;
      }>(`units/${active.unit_id}`, {
        is_pmr: next.is_pmr,
        is_active: !next.disabled,
        operational_status: next.disabled ? "disabled" : "active",
      });
    },
    onSuccess: (data, vars) => {
      setEditPmr(vars.is_pmr);
      setEditDisabled(vars.disabled);
      setMessage({ kind: "success", text: t("safes.settingsSaved") });
      if (active && onSafeUpdated) {
        onSafeUpdated({
          ...active,
          is_pmr: data.is_pmr,
          is_active: data.is_active,
          operational_status: data.operational_status,
        });
      }
      onActionDone();
    },
    onError: (err) => {
      if (active) {
        setEditPmr(Boolean(active.is_pmr));
        setEditDisabled(isSafeDisabled(active));
      }
      setMessage({
        kind: "error",
        text: err instanceof ApiError ? err.message : t("safes.settingsSaveError"),
      });
    },
  });

  const markEmpty = useMutation({
    mutationFn: async () => {
      if (!active) throw new Error("no_safe");
      return api.post(`units/${active.unit_id}/mark-empty`, undefined, {
        "Idempotency-Key": idempotencyKey(),
      });
    },
    onSuccess: () => {
      setMessage({ kind: "success", text: t("safes.markEmptyDone") });
      onActionDone();
    },
    onError: (err) => {
      setMessage({
        kind: "error",
        text: err instanceof ApiError ? err.message : t("common.loadError"),
      });
    },
  });

  if (!active) return null;

  const statusView: SafeGridItem = {
    ...active,
    is_pmr: editPmr,
    is_active: !editDisabled,
    operational_status: editDisabled ? "disabled" : active.operational_status,
  };
  const statusText = safeStateLabel(statusView, t);
  const settingsBusy = settingsMutation.isPending || markEmpty.isPending;

  return (
    <BottomSheet
      open={open && Boolean(safe)}
      onClose={onClose}
      closeLabel={t("common.back")}
      closeDisabled={settingsBusy}
      zIndexClassName="z-50"
      panelClassName="flex max-h-[88dvh] flex-col overflow-hidden"
    >
      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-brand-border" aria-hidden />

      <div className="overflow-y-auto px-5 pb-5 pt-3">
        <h2 className="text-center text-lg font-bold text-brand-text">
          {t("safes.unitTitle", { label: active.label })}
        </h2>
        <p className="mt-1 text-center text-sm text-brand-text-muted">{statusText}</p>

        <div className="mt-3 space-y-2.5 rounded-xl border border-brand-border bg-brand-cream/60 px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-brand-text-muted">{t("safes.pmr")}</span>
            <Switch
              isSelected={editPmr}
              isDisabled={settingsBusy}
              onChange={(value) => {
                setEditPmr(value);
                setMessage(null);
                settingsMutation.mutate({ is_pmr: value, disabled: editDisabled });
              }}
              aria-label={t("safes.pmr")}
            >
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Content>
            </Switch>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-brand-text-muted">{t("safes.lockOff")}</span>
            <Switch
              isSelected={editDisabled}
              isDisabled={settingsBusy}
              onChange={(value) => {
                setEditDisabled(value);
                setMessage(null);
                settingsMutation.mutate({ is_pmr: editPmr, disabled: value });
              }}
              aria-label={t("safes.lockOff")}
            >
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Content>
            </Switch>
          </div>
        </div>

        {active.operational_status === "pending_empty" && !editDisabled ? (
          <Button
            variant="primary"
            className="mt-3 h-11 w-full bg-brand-gold font-semibold text-white"
            isDisabled={settingsBusy}
            onPress={() => {
              setMessage(null);
              markEmpty.mutate();
            }}
          >
            {markEmpty.isPending ? t("common.loading") : t("safes.markEmpty")}
          </Button>
        ) : null}

        {message ? (
          <p
            className={cn(
              "mt-3 rounded-lg px-3 py-2 text-sm",
              message.kind === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800",
            )}
          >
            {message.text}
          </p>
        ) : null}

        <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-text-muted">
          {t("safes.reservations")}
        </h3>

        {ordersLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="sm" className="text-brand-gold" />
          </div>
        ) : (unitOrders ?? []).length === 0 ? (
          <p className="py-6 text-center text-sm text-brand-text-muted">{t("safes.ordersEmpty")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {(unitOrders ?? []).map((row) => (
              <li key={row.id}>
                <Link
                  href={`/reservation/${row.id}/?point=${pointId}`}
                  className="block rounded-[14px] border border-brand-border bg-brand-cream px-3.5 py-3 active:scale-[0.99]"
                  onClick={onClose}
                >
                  <div className="font-semibold text-brand-text">#{row.public_id}</div>
                  <div className="mt-0.5 text-sm capitalize text-brand-text-muted">
                    {t(`lifecycle.${row.lifecycle}`)} · {t(`status.${row.status}`)}
                  </div>
                  {row.client_name || row.email ? (
                    <div className="mt-0.5 truncate text-xs text-brand-text-muted">
                      {row.client_name || row.email}
                    </div>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {settingsBusy ? (
          <div className="mt-3 flex justify-center">
            <Spinner size="sm" className="text-brand-gold" />
          </div>
        ) : null}
      </div>
    </BottomSheet>
  );
}
