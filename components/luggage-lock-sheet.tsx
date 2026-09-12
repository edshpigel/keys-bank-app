"use client";

import { Button, Spinner } from "@heroui/react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  ApiError,
  api,
  type LockActionItem,
  type LuggageGridItem,
  type ReservationsListResponse,
  type UnitReservationItem,
} from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { idempotencyKey } from "@/lib/idempotency";
import { canOccupyLocker, luggageHistoryLabel, luggageStateLabel } from "@/lib/luggage";
import { useI18n, useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  lock: LuggageGridItem | null;
  pointId: string;
  timeZone?: string;
  onClose: () => void;
  onActionDone: () => void;
};

type MainTab = "orders" | "history";

export function LuggageLockSheet({
  open,
  lock,
  pointId,
  timeZone,
  onClose,
  onActionDone,
}: Props) {
  const t = useT();
  const { locale } = useI18n();
  const [mainTab, setMainTab] = useState<MainTab>("orders");
  const [reservationId, setReservationId] = useState("");
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setReservationId("");
    setMessage(null);
    setMainTab("orders");
  }, [lock?.unit_id]);

  const { data: unitOrders } = useQuery({
    queryKey: ["operator", "unit-reservations", lock?.unit_id],
    queryFn: () => api.get<UnitReservationItem[]>(`units/${lock!.unit_id}/reservations`),
    enabled: open && Boolean(lock?.unit_id),
  });

  const { data: reservations } = useQuery({
    queryKey: ["operator", "luggage-reservations", pointId],
    queryFn: async () => {
      const page = await api.get<ReservationsListResponse>(`points/${pointId}/reservations`, {
        status: "active",
        service: "luggage",
        limit: 100,
      });
      return page.items;
    },
    enabled: open && Boolean(pointId),
  });

  const luggageBookings = reservations ?? [];

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
    mutationFn: async ({
      action,
      reservation_id,
    }: {
      action: "open" | "clear" | "occupy";
      reservation_id?: string;
    }) => {
      if (!lock) throw new Error("no_lock");
      const path = `luggage-locks/${lock.unit_id}/${action}`;
      const body = reservation_id ? { reservation_id } : undefined;
      return api.post(path, body, { "Idempotency-Key": idempotencyKey() });
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

  if (!open || !lock) return null;

  const showOccupy = canOccupyLocker(lock);
  const statusText = luggageStateLabel(lock, t);
  const statusMeta = lock.api_stateno ? `${statusText} (stateno=${lock.api_stateno})` : statusText;

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
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {showOccupy ? (
                <div className="space-y-2 border-t border-brand-border pt-3">
                  <label className="block text-sm font-medium text-brand-text-muted">
                    {t("luggage.occupySelect")}
                  </label>
                  {luggageBookings.length === 0 ? (
                    <p className="text-sm text-brand-text-muted">{t("luggage.occupyNoBooking")}</p>
                  ) : (
                    <select
                      className="h-11 w-full rounded-xl border border-brand-border bg-white px-3 text-sm"
                      value={reservationId}
                      onChange={(e) => setReservationId(e.target.value)}
                    >
                      <option value="">{t("luggage.occupyPlaceholder")}</option>
                      {luggageBookings.map((r) => (
                        <option key={r.id} value={r.id}>
                          #{r.public_id} · {r.email}
                        </option>
                      ))}
                    </select>
                  )}
                  <Button
                    variant="primary"
                    className="h-11 w-full bg-brand-gold text-white"
                    isDisabled={mutation.isPending || !reservationId}
                    onPress={() => {
                      setMessage(null);
                      mutation.mutate({ action: "occupy", reservation_id: reservationId });
                    }}
                  >
                    {mutation.isPending ? t("common.loading") : t("luggage.occupy")}
                  </Button>
                </div>
              ) : null}
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

          {mutation.isPending ? (
            <div className="mt-3 flex justify-center">
              <Spinner size="sm" className="text-brand-gold" />
            </div>
          ) : null}
        </div>

        <div className="shrink-0 space-y-2 border-t border-brand-border px-5 py-4">
          <Button
            variant="secondary"
            className="h-12 w-full border-brand-text font-semibold"
            isDisabled={mutation.isPending}
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
            isDisabled={mutation.isPending}
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
