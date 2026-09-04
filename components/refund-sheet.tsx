"use client";

import { Button, Spinner } from "@heroui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ApiError, api, type RefundOptions } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { idempotencyKey } from "@/lib/idempotency";
import { useI18n, useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  reservationId: string;
  onClose: () => void;
  onDone: () => void;
};

export function RefundSheet({ open, reservationId, onClose, onDone }: Props) {
  const t = useT();
  const { locale } = useI18n();
  const [notifyClient, setNotifyClient] = useState(true);
  const [notifyTelegram, setNotifyTelegram] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["operator", "refund-options", reservationId],
    queryFn: () => api.get<RefundOptions>(`reservations/${reservationId}/refund-options`),
    enabled: open,
  });

  const refundable = (data?.payments ?? []).filter((p) => p.can_refund);

  const refundMutation = useMutation({
    mutationFn: async () => {
      for (const payment of refundable) {
        await api.post(
          `payments/${payment.payment_id}/refund`,
          { notify_client: notifyClient, notify_telegram: notifyTelegram },
          { "Idempotency-Key": idempotencyKey() },
        );
      }
      if (refundable.length > 0) {
        await api.post(`reservations/${reservationId}/refund-notify`);
      }
    },
    onSuccess: onDone,
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : t("reservation.actionFailed"));
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label={t("common.back")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl",
          "safe-bottom max-h-[85dvh] overflow-y-auto",
        )}
      >
        <h2 className="text-lg font-semibold">{t("reservation.refundTitle")}</h2>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner className="text-brand-gold" />
          </div>
        ) : null}

        {!isLoading && refundable.length === 0 ? (
          <p className="py-6 text-sm text-brand-text-muted">{t("reservation.refundNoPayments")}</p>
        ) : null}

        {!isLoading && refundable.length > 0 ? (
          <>
            <ul className="my-4 space-y-2">
              {refundable.map((payment) => (
                <li
                  key={payment.payment_id}
                  className="flex items-center justify-between rounded-xl bg-brand-cream px-3 py-2 text-sm"
                >
                  <span>
                    {payment.kind === "extension"
                      ? t("reservation.refundTypeExtension")
                      : t("reservation.refundTypeInitial")}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(payment.amount_ttc_cents, payment.currency || "EUR", locale)}
                  </span>
                </li>
              ))}
            </ul>

            <label className="mb-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifyClient}
                onChange={(e) => setNotifyClient(e.target.checked)}
              />
              {t("reservation.refundNotifyClient")}
            </label>
            <label className="mb-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifyTelegram}
                onChange={(e) => setNotifyTelegram(e.target.checked)}
              />
              {t("reservation.refundNotifyTelegram")}
            </label>

            {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onPress={onClose} isDisabled={refundMutation.isPending}>
                {t("reservation.cancel")}
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                isDisabled={refundMutation.isPending}
                onPress={() => {
                  setError(null);
                  refundMutation.mutate();
                }}
              >
                {refundMutation.isPending ? t("reservation.refundProcessing") : t("reservation.refundConfirm")}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
