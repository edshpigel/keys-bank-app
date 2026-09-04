"use client";

import { Alert, Button, Card, Spinner } from "@heroui/react";
import { ChevronDown } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { RefundSheet } from "@/components/refund-sheet";
import { ApiError, api, type NotificationLogItem, type ReservationDetail } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { idempotencyKey } from "@/lib/idempotency";
import { useI18n, useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

type Props = {
  reservationId: string;
  detail: ReservationDetail;
  timeZone?: string;
};

export function ReservationActionsPanel({ reservationId, detail, timeZone }: Props) {
  const t = useT();
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const { data: notifications } = useQuery({
    queryKey: ["operator", "notifications", reservationId],
    queryFn: () => api.get<NotificationLogItem[]>(`reservations/${reservationId}/notifications`),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async ({
      path,
      body,
      idempotent,
    }: {
      path: string;
      body?: unknown;
      idempotent?: boolean;
    }) => {
      const headers = idempotent ? { "Idempotency-Key": idempotencyKey() } : undefined;
      return api.post(path, body, headers);
    },
    onSuccess: () => {
      setMessage({ kind: "success", text: t("reservation.actionSuccess") });
      void queryClient.invalidateQueries({ queryKey: ["operator", "reservation", reservationId] });
      void queryClient.invalidateQueries({ queryKey: ["operator", "notifications", reservationId] });
    },
    onError: (err) => {
      const text = err instanceof ApiError ? err.message : t("reservation.actionFailed");
      setMessage({ kind: "error", text });
    },
  });

  const actions = [
    {
      key: "refreshTtlock",
      label: t("reservation.refreshTtlock"),
      show: detail.actions.can_refresh_ttlock,
      run: () => mutation.mutate({ path: `reservations/${reservationId}/ttlock/refresh` }),
    },
    {
      key: "resendEmail",
      label: t("reservation.resendEmail"),
      show: detail.status === "confirmed",
      run: () => mutation.mutate({ path: `reservations/${reservationId}/notify/email` }),
    },
    {
      key: "resendSms",
      label: t("reservation.resendSms"),
      show: detail.status === "confirmed" && Boolean(detail.phone_e164),
      run: () => mutation.mutate({ path: `reservations/${reservationId}/notify/sms` }),
    },
    {
      key: "retryProvisioning",
      label: t("reservation.retryProvisioning"),
      show: detail.actions.can_retry_provisioning,
      run: () => mutation.mutate({ path: `reservations/${reservationId}/provisioning/retry` }),
    },
    {
      key: "cancelAutoRenew",
      label: t("reservation.cancelAutoRenew"),
      show: detail.actions.can_cancel_auto_renew,
      run: () => mutation.mutate({ path: `reservations/${reservationId}/auto-renew/cancel` }),
    },
    {
      key: "rebookLocker",
      label: t("reservation.rebookLocker"),
      show: detail.actions.can_rebook,
      run: () =>
        mutation.mutate({
          path: `reservations/${reservationId}/rebook-locker`,
          idempotent: true,
        }),
    },
    {
      key: "refund",
      label: t("reservation.refund"),
      show: detail.payments.some((p) => p.status === "paid"),
      run: () => setRefundOpen(true),
    },
  ].filter((a) => a.show);

  if (actions.length === 0) return null;

  return (
    <>
      <Card className="border border-brand-border bg-white">
        <Card.Content className="p-0">
          <button
            type="button"
            className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold"
            onClick={() => setOpen((v) => !v)}
          >
            {t("reservation.actionsTitle")}
            <ChevronDown className={cn("h-5 w-5 transition", open && "rotate-180")} />
          </button>

          {open ? (
            <div className="space-y-3 border-t border-brand-border px-5 pb-5 pt-3">
              {message ? (
                <Alert status={message.kind === "error" ? "danger" : "accent"}>{message.text}</Alert>
              ) : null}

              <div className="grid gap-2">
                {actions.map((action) => (
                  <Button
                    key={action.key}
                    variant={action.key === "refund" ? "danger" : "secondary"}
                    className="h-11 w-full justify-center"
                    isDisabled={mutation.isPending}
                    onPress={action.run}
                  >
                    {mutation.isPending ? t("common.loading") : action.label}
                  </Button>
                ))}
              </div>

              {mutation.isPending ? (
                <div className="flex justify-center py-2">
                  <Spinner size="sm" className="text-brand-gold" />
                </div>
              ) : null}

              <div className="pt-2">
                <h3 className="mb-2 text-sm font-semibold text-brand-text-muted">
                  {t("reservation.notificationsTitle")}
                </h3>
                {(notifications ?? []).length === 0 ? (
                  <p className="text-sm text-brand-text-muted">{t("reservation.notificationsEmpty")}</p>
                ) : (
                  <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
                    {(notifications ?? []).map((row) => (
                      <li
                        key={row.id}
                        className="rounded-lg bg-brand-cream px-3 py-2"
                      >
                        <div className="font-medium capitalize">
                          {row.service} · {row.operation}
                        </div>
                        <div className="text-xs text-brand-text-muted">
                          {row.created_at
                            ? formatDateTime(row.created_at, locale, timeZone)
                            : "—"}
                          {row.status_code ? ` · ${row.status_code}` : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </Card.Content>
      </Card>

      <RefundSheet
        open={refundOpen}
        reservationId={reservationId}
        onClose={() => setRefundOpen(false)}
        onDone={() => {
          setRefundOpen(false);
          setMessage({ kind: "success", text: t("reservation.refundDone") });
          void queryClient.invalidateQueries({ queryKey: ["operator", "reservation", reservationId] });
        }}
      />
    </>
  );
}
