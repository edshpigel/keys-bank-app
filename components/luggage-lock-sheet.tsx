"use client";

import { Button, Spinner } from "@heroui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { ApiError, api, type LockActionItem, type LuggageGridItem, type ReservationsListResponse } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { idempotencyKey } from "@/lib/idempotency";
import { canOccupyLocker } from "@/lib/luggage";
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
  const [reservationId, setReservationId] = useState("");
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setReservationId("");
    setMessage(null);
  }, [lock?.unit_id]);

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

  const unitHistory = (lockActions ?? [])
    .filter((row) => row.unit_id === lock?.unit_id)
    .slice(0, 8);

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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <button type="button" className="absolute inset-0" aria-label={t("common.back")} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl",
          "safe-bottom max-h-[88dvh] overflow-y-auto",
        )}
      >
        <h2 className="text-lg font-semibold">{t("luggage.sheetTitle", { label: lock.label })}</h2>
        {lock.fixno || lock.lockno ? (
          <p className="mt-1 text-xs text-brand-text-muted">
            {[lock.fixno, lock.lockno].filter(Boolean).join(" · ")}
          </p>
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
          <Button
            variant="secondary"
            className="h-11"
            isDisabled={mutation.isPending}
            onPress={() => {
              setMessage(null);
              mutation.mutate({ action: "open" });
            }}
          >
            {t("luggage.open")}
          </Button>
          <Button
            variant="secondary"
            className="h-11"
            isDisabled={mutation.isPending}
            onPress={() => {
              setMessage(null);
              mutation.mutate({ action: "clear" });
            }}
          >
            {t("luggage.clear")}
          </Button>
        </div>

        {showOccupy ? (
          <div className="mt-4 space-y-2">
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

        {mutation.isPending ? (
          <div className="mt-3 flex justify-center">
            <Spinner size="sm" className="text-brand-gold" />
          </div>
        ) : null}

        <div className="mt-5 border-t border-brand-border pt-4">
          <h3 className="mb-2 text-sm font-semibold text-brand-text-muted">{t("luggage.historyTitle")}</h3>
          {unitHistory.length === 0 ? (
            <p className="text-sm text-brand-text-muted">{t("luggage.historyEmpty")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {unitHistory.map((row) => (
                <li key={row.id} className="rounded-lg bg-brand-cream px-3 py-2">
                  <div className="font-medium capitalize">{row.action}</div>
                  <div className="text-xs text-brand-text-muted">
                    {row.created_at ? formatDateTime(row.created_at, locale, timeZone) : "—"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button variant="ghost" className="mt-4 w-full" onPress={onClose}>
          {t("reservation.cancel")}
        </Button>
      </div>
    </div>
  );
}
