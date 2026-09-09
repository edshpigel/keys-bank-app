"use client";

import { Alert, Spinner } from "@heroui/react";
import { ChevronRight } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { RefundSheet } from "@/components/refund-sheet";
import { SectionLabel, SoftCard } from "@/components/ui/soft-card";
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
  const [refundOpen, setRefundOpen] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const { data: notifications } = useQuery({
    queryKey: ["operator", "notifications", reservationId],
    queryFn: () => api.get<NotificationLogItem[]>(`reservations/${reservationId}/notifications`),
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
      danger: false,
      show: detail.actions.can_refresh_ttlock,
      run: () => mutation.mutate({ path: `reservations/${reservationId}/ttlock/refresh` }),
    },
    {
      key: "resendSms",
      label: t("reservation.resendSms"),
      danger: false,
      show: detail.status === "confirmed" && Boolean(detail.phone_e164),
      run: () => mutation.mutate({ path: `reservations/${reservationId}/notify/sms` }),
    },
    {
      key: "resendEmail",
      label: t("reservation.resendEmail"),
      danger: false,
      show: detail.status === "confirmed",
      run: () => mutation.mutate({ path: `reservations/${reservationId}/notify/email` }),
    },
    {
      key: "retryProvisioning",
      label: t("reservation.retryProvisioning"),
      danger: false,
      show: detail.actions.can_retry_provisioning,
      run: () => mutation.mutate({ path: `reservations/${reservationId}/provisioning/retry` }),
    },
    {
      key: "rebookLocker",
      label: t("reservation.rebookLocker"),
      danger: false,
      show: detail.actions.can_rebook,
      run: () =>
        mutation.mutate({
          path: `reservations/${reservationId}/rebook-locker`,
          idempotent: true,
        }),
    },
    {
      key: "cancelAutoRenew",
      label: t("reservation.cancelAutoRenew"),
      danger: true,
      show: detail.actions.can_cancel_auto_renew,
      run: () => mutation.mutate({ path: `reservations/${reservationId}/auto-renew/cancel` }),
    },
    {
      key: "refund",
      label: t("reservation.refundBooking"),
      danger: true,
      show: detail.payments.some((p) => p.status === "paid"),
      run: () => setRefundOpen(true),
    },
  ].filter((a) => a.show);

  if (actions.length === 0 && (notifications ?? []).length === 0) return null;

  return (
    <>
      {actions.length > 0 ? (
        <div className="space-y-2">
          <SectionLabel>{t("reservation.sectionActions")}</SectionLabel>
          <SoftCard padding="none" className="overflow-hidden">
            {message ? (
              <div className="border-b border-brand-border px-3.5 py-2">
                <Alert status={message.kind === "error" ? "danger" : "accent"}>{message.text}</Alert>
              </div>
            ) : null}
            <ul>
              {actions.map((action) => (
                <li key={action.key} className="border-b border-brand-border last:border-b-0">
                  <button
                    type="button"
                    disabled={mutation.isPending}
                    onClick={action.run}
                    className={cn(
                      "flex w-full items-center justify-between px-3.5 py-3.5 text-left text-[15px] transition active:bg-black/[0.03]",
                      action.danger ? "font-medium text-[#C0392B]" : "font-medium text-brand-text",
                    )}
                  >
                    <span>{mutation.isPending ? t("common.loading") : action.label}</span>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0",
                        action.danger ? "text-[#C0392B]/70" : "text-brand-text-muted",
                      )}
                      strokeWidth={2}
                    />
                  </button>
                </li>
              ))}
            </ul>
            {mutation.isPending ? (
              <div className="flex justify-center border-t border-brand-border py-2">
                <Spinner size="sm" className="text-brand-gold" />
              </div>
            ) : null}
          </SoftCard>
        </div>
      ) : null}

      {(notifications ?? []).length > 0 ? (
        <div className="space-y-2">
          <SectionLabel>{t("reservation.notificationsTitle")}</SectionLabel>
          <SoftCard padding="none" className="overflow-hidden">
            <ul className="max-h-56 overflow-y-auto">
              {(notifications ?? []).map((row) => (
                <li
                  key={row.id}
                  className="flex items-start justify-between gap-3 border-b border-brand-border px-3.5 py-2.5 last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium capitalize text-brand-text">
                      {row.service} · {row.operation}
                    </div>
                    <div className="text-[11px] text-brand-text-muted">
                      {row.status_code ? `${row.status_code}` : ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-[11px] text-brand-text-muted">
                    {row.created_at ? formatDateTime(row.created_at, locale, timeZone) : "—"}
                  </div>
                </li>
              ))}
            </ul>
          </SoftCard>
        </div>
      ) : null}

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
