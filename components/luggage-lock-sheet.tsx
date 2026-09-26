"use client";

import { Button, Spinner, Switch } from "@heroui/react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  ApiError,
  api,
  type LockActionItem,
  type LuggageGridItem,
  type UnitReservationItem,
} from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { idempotencyKey } from "@/lib/idempotency";
import {
  isLuggageDisabled,
  luggageHistoryLabel,
  luggageStateLabel,
} from "@/lib/luggage";
import { useI18n, useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  lock: LuggageGridItem | null;
  pointId: string;
  timeZone?: string;
  onClose: () => void;
  onActionDone: () => void;
  onLockUpdated?: (next: LuggageGridItem) => void;
};

type MainTab = "orders" | "history";

export function LuggageLockSheet({
  open,
  lock,
  pointId,
  timeZone,
  onClose,
  onActionDone,
  onLockUpdated,
}: Props) {
  const t = useT();
  const { locale } = useI18n();
  const [mainTab, setMainTab] = useState<MainTab>("orders");
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [editPmr, setEditPmr] = useState(false);
  const [editDisabled, setEditDisabled] = useState(false);

  useEffect(() => {
    if (!open || !lock) return;
    setMessage(null);
    setMainTab("orders");
    setEditPmr(Boolean(lock.is_pmr));
    setEditDisabled(isLuggageDisabled(lock));
  }, [open, lock?.unit_id]);

  const { data: unitOrders } = useQuery({
    queryKey: ["operator", "unit-reservations", lock?.unit_id],
    queryFn: () => api.get<UnitReservationItem[]>(`units/${lock!.unit_id}/reservations`),
    enabled: open && Boolean(lock?.unit_id),
  });

  const { data: lockActions, refetch: refetchActions } = useQuery({
    queryKey: ["operator", "lock-actions", pointId],
    queryFn: () => api.get<LockActionItem[]>(`points/${pointId}/lock-actions`),
    enabled: open && Boolean(pointId),
  });

  const unitHistory = useMemo(
    () =>
      (lockActions ?? [])
        .filter((row) => row.unit_id === lock?.unit_id)
        .slice(0, 40),
    [lockActions, lock?.unit_id],
  );

  const mutation = useMutation({
    mutationFn: async ({ action }: { action: "open" | "clear" }) => {
      if (!lock) throw new Error("no_lock");
      return api.post(`luggage-locks/${lock.unit_id}/${action}`, undefined, {
        "Idempotency-Key": idempotencyKey(),
      });
    },
    onSuccess: () => {
      setMessage({ kind: "success", text: t("luggage.actionSuccess") });
      void refetchActions();
      onActionDone();
    },
    onError: (err) => {
      setMessage({
        kind: "error",
        text: err instanceof ApiError ? err.message : t("luggage.actionFailed"),
      });
    },
  });

  const settingsMutation = useMutation({
    mutationFn: async (next: { is_pmr: boolean; disabled: boolean }) => {
      if (!lock) throw new Error("no_lock");
      const keepReserved = !next.disabled && lock.operational_status === "reserved";
      const keepPending = !next.disabled && lock.operational_status === "pending_empty";
      return api.patch<{
        is_pmr: boolean;
        is_active: boolean;
        operational_status: string;
      }>(`units/${lock.unit_id}`, {
        is_pmr: next.is_pmr,
        is_active: !next.disabled,
        operational_status: next.disabled
          ? "disabled"
          : keepPending
            ? "pending_empty"
            : keepReserved
              ? "reserved"
              : "active",
      });
    },
    onSuccess: (data, vars) => {
      setEditPmr(vars.is_pmr);
      setEditDisabled(vars.disabled);
      setMessage({ kind: "success", text: t("luggage.settingsSaved") });
      if (lock && onLockUpdated) {
        onLockUpdated({
          ...lock,
          is_pmr: data.is_pmr,
          is_active: data.is_active,
          operational_status: data.operational_status,
        });
      }
      onActionDone();
    },
    onError: (err) => {
      if (lock) {
        setEditPmr(Boolean(lock.is_pmr));
        setEditDisabled(isLuggageDisabled(lock));
      }
      setMessage({
        kind: "error",
        text: err instanceof ApiError ? err.message : t("luggage.settingsSaveError"),
      });
    },
  });

  if (!open || !lock) return null;

  const statusLock: LuggageGridItem = {
    ...lock,
    is_pmr: editPmr,
    is_active: !editDisabled,
    operational_status: editDisabled ? "disabled" : lock.operational_status,
  };
  const statusText = luggageStateLabel(statusLock, t);
  const statusMeta =
    !editDisabled && lock.api_stateno ? `${statusText} (stateno=${lock.api_stateno})` : statusText;
  const settingsBusy = settingsMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <button type="button" className="absolute inset-0" aria-label={t("common.back")} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 flex w-full max-w-md flex-col rounded-t-2xl bg-white shadow-xl",
          "safe-bottom max-h-[88dvh]",
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-brand-border" aria-hidden />

        <div className="overflow-y-auto px-5 pb-4 pt-3">
          <h2 className="text-center text-lg font-bold text-brand-text">
            {t("luggage.sheetTitle", { label: lock.label })}
          </h2>
          <p className="mt-1 text-center text-sm text-brand-text-muted">{statusMeta}</p>

          <div className="mt-3 space-y-2.5 rounded-xl border border-brand-border bg-brand-cream/60 px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-brand-text-muted">{t("luggage.pmr")}</span>
              <Switch
                isSelected={editPmr}
                isDisabled={settingsBusy || mutation.isPending}
                onChange={(value) => {
                  setEditPmr(value);
                  setMessage(null);
                  settingsMutation.mutate({ is_pmr: value, disabled: editDisabled });
                }}
                aria-label={t("luggage.pmr")}
              >
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Content>
              </Switch>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-brand-text-muted">{t("luggage.lockOff")}</span>
              <Switch
                isSelected={editDisabled}
                isDisabled={settingsBusy || mutation.isPending}
                onChange={(value) => {
                  setEditDisabled(value);
                  setMessage(null);
                  settingsMutation.mutate({ is_pmr: editPmr, disabled: value });
                }}
                aria-label={t("luggage.lockOff")}
              >
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Content>
              </Switch>
            </div>
          </div>

          {lock.operational_status === "reserved" && !editDisabled ? (
            <div className="mt-3 rounded-xl border border-brand-gold/40 bg-brand-gold/10 px-3.5 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-text-muted">
                {t("luggage.reservedFor")}
              </p>
              <p className="mt-1 text-sm font-semibold text-brand-text">
                {lock.reserved_public_id ? `#${lock.reserved_public_id}` : "—"}
                {lock.reserved_client_name ? ` · ${lock.reserved_client_name}` : ""}
              </p>
              {lock.reserved_email ? (
                <p className="mt-0.5 truncate text-xs text-brand-text-muted">{lock.reserved_email}</p>
              ) : null}
              {lock.reserved_reservation_id ? (
                <Link
                  href={`/reservation/${lock.reserved_reservation_id}/?point=${pointId}`}
                  className="mt-2 inline-block text-xs font-semibold text-brand-gold"
                >
                  {t("luggage.openBooking")}
                </Link>
              ) : null}
            </div>
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

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={cn(
                "h-10 rounded-full border text-sm font-semibold transition",
                mainTab === "orders"
                  ? "border-transparent bg-brand-gold text-white"
                  : "border-brand-border bg-white text-brand-text",
              )}
              onClick={() => setMainTab("orders")}
            >
              {t("luggage.tabOrders")}
            </button>
            <button
              type="button"
              className={cn(
                "h-10 rounded-full border text-sm font-semibold transition",
                mainTab === "history"
                  ? "border-transparent bg-brand-gold text-white"
                  : "border-brand-border bg-white text-brand-text",
              )}
              onClick={() => setMainTab("history")}
            >
              {t("luggage.tabHistory")}
            </button>
          </div>

          {mainTab === "orders" ? (
            <div className="mt-4 space-y-3">
              {(unitOrders ?? []).length === 0 ? (
                <p className="py-4 text-center text-sm text-brand-text-muted">{t("luggage.ordersEmpty")}</p>
              ) : (
                <ul className="space-y-2">
                  {(unitOrders ?? []).map((row) => (
                    <li key={row.id}>
                      <Link
                        href={`/reservation/${row.id}/?point=${pointId}`}
                        className="block rounded-[14px] border border-brand-border bg-brand-cream px-3.5 py-3 active:scale-[0.99]"
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
            </div>
          ) : (
            <div className="mt-4">
              {unitHistory.length === 0 ? (
                <p className="py-4 text-center text-sm text-brand-text-muted">{t("luggage.historyEmpty")}</p>
              ) : (
                <ul className="space-y-2">
                  {unitHistory.map((row) => (
                    <li key={row.id} className="rounded-xl bg-[#f3f3f3] px-3.5 py-3">
                      <div className="text-xs text-brand-text-muted">
                        {row.created_at ? formatDateTime(row.created_at, locale, timeZone) : "—"}
                      </div>
                      <div className="mt-1 text-sm font-medium text-brand-text">
                        {luggageHistoryLabel(row.action, t, row.reservation_public_id)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {mutation.isPending || settingsBusy ? (
            <div className="mt-3 flex justify-center">
              <Spinner size="sm" className="text-brand-gold" />
            </div>
          ) : null}
        </div>

        <div className="shrink-0 space-y-2 border-t border-brand-border px-5 py-4">
          <Button
            variant="secondary"
            className="h-12 w-full border-brand-text font-semibold"
            isDisabled={mutation.isPending || settingsBusy}
            onPress={() => {
              setMessage(null);
              mutation.mutate({ action: "clear" });
            }}
          >
            {t("luggage.clear")}
          </Button>
          <Button
            variant="primary"
            className="h-12 w-full bg-brand-gold font-semibold text-white"
            isDisabled={mutation.isPending || settingsBusy}
            onPress={() => {
              setMessage(null);
              mutation.mutate({ action: "open" });
            }}
          >
            {t("luggage.open")}
          </Button>
        </div>
      </div>
    </div>
  );
}
