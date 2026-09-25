"use client";

import { Alert, Spinner } from "@heroui/react";
import { ChevronRight } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { ConfirmActionSheet } from "@/components/confirm-action-sheet";
import { SoftCard } from "@/components/ui/soft-card";
import { ApiError, api, type ReservationDetail } from "@/lib/api";
import { useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";
import { idempotencyKey } from "@/lib/idempotency";

type ActionsFlags = {
  can_refresh_ttlock?: boolean;
  can_rebook?: boolean;
  can_cancel_auto_renew?: boolean;
  can_retry_provisioning?: boolean;
};

type Props = {
  reservationId: string;
  pointId: string;
  status: string;
  phoneE164?: string | null;
  actions?: ActionsFlags;
};

type PendingAction = {
  key: string;
  label: string;
  danger: boolean;
  run: () => void;
};

export function ClientBookingActions({
  reservationId,
  pointId,
  status,
  phoneE164,
  actions,
}: Props) {
  const t = useT();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const detailQuery = useQuery({
    queryKey: ["operator", "reservation", reservationId],
    queryFn: () => api.get<ReservationDetail>(`reservations/${reservationId}`),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async ({
      path,
      idempotent,
    }: {
      path: string;
      idempotent?: boolean;
    }) => {
      const headers = idempotent ? { "Idempotency-Key": idempotencyKey() } : undefined;
      return api.post(path, undefined, headers);
    },
    onSuccess: () => {
      setPendingAction(null);
      setMessage({ kind: "success", text: t("reservation.actionSuccess") });
      void queryClient.invalidateQueries({ queryKey: ["operator", "client"] });
      void queryClient.invalidateQueries({ queryKey: ["operator", "reservation", reservationId] });
    },
    onError: (err) => {
      setMessage({
        kind: "error",
        text: err instanceof ApiError ? err.message : t("reservation.actionFailed"),
      });
    },
  });

  const flags = detailQuery.data?.actions ?? actions;
  const phone = detailQuery.data?.phone_e164 ?? phoneE164;
  const confirmed = (detailQuery.data?.status ?? status) === "confirmed";

  const items = [
    {
      key: "refreshTtlock",
      label: t("reservation.refreshTtlock"),
      show: Boolean(flags?.can_refresh_ttlock),
      danger: false,
      run: () => mutation.mutate({ path: `reservations/${reservationId}/ttlock/refresh` }),
    },
    {
      key: "resendSms",
      label: t("reservation.resendSms"),
      show: confirmed && Boolean(phone),
      danger: false,
      run: () => mutation.mutate({ path: `reservations/${reservationId}/notify/sms` }),
    },
    {
      key: "resendEmail",
      label: t("reservation.resendEmail"),
      show: confirmed,
      danger: false,
      run: () => mutation.mutate({ path: `reservations/${reservationId}/notify/email` }),
    },
    {
      key: "retryProvisioning",
      label: t("reservation.retryProvisioning"),
      show: Boolean(flags?.can_retry_provisioning),
      danger: false,
      run: () => mutation.mutate({ path: `reservations/${reservationId}/provisioning/retry` }),
    },
    {
      key: "rebookLocker",
      label: t("reservation.rebookLocker"),
      show: Boolean(flags?.can_rebook),
      danger: false,
      run: () =>
        mutation.mutate({
          path: `reservations/${reservationId}/rebook-locker`,
          idempotent: true,
        }),
    },
    {
      key: "cancelAutoRenew",
      label: t("reservation.cancelAutoRenew"),
      show: Boolean(flags?.can_cancel_auto_renew),
      danger: true,
      run: () => mutation.mutate({ path: `reservations/${reservationId}/auto-renew/cancel` }),
    },
  ].filter((a) => a.show);

  return (
    <div className="mt-2 border-t border-brand-border pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-0.5 py-1 text-left text-[12px] font-semibold text-brand-gold"
      >
        <span>{t("reservation.sectionActions")}</span>
        <ChevronRight className={cn("h-3.5 w-3.5 transition", open ? "rotate-90" : "")} />
      </button>
      {open ? (
        <div className="mt-1 space-y-1">
          {message ? (
            <Alert status={message.kind === "error" ? "danger" : "accent"}>{message.text}</Alert>
          ) : null}
          {detailQuery.isLoading ? (
            <div className="flex justify-center py-2">
              <Spinner size="sm" className="text-brand-gold" />
            </div>
          ) : null}
          <SoftCard padding="none">
            <ul>
              {items.map((action) => (
                <li key={action.key} className="border-b border-brand-border last:border-b-0">
                  <button
                    type="button"
                    disabled={mutation.isPending}
                    onClick={() => {
                      setMessage(null);
                      setPendingAction({
                        key: action.key,
                        label: action.label,
                        danger: action.danger,
                        run: action.run,
                      });
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2.5 text-left text-[13px] transition active:bg-black/[0.03]",
                      action.danger ? "font-medium text-[#C0392B]" : "font-medium text-brand-text",
                    )}
                  >
                    <span>{action.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-brand-text-muted" />
                  </button>
                </li>
              ))}
            </ul>
          </SoftCard>
          <Link
            href={`/reservation/${reservationId}/?point=${pointId}`}
            className="block px-2 py-2 text-[12px] font-semibold text-brand-gold"
          >
            {t("clients.openReservation")} →
          </Link>
        </div>
      ) : null}

      <ConfirmActionSheet
        open={Boolean(pendingAction)}
        title={t("reservation.confirmTitle")}
        description={
          pendingAction
            ? t("reservation.confirmBody", { action: pendingAction.label })
            : ""
        }
        confirmLabel={t("reservation.confirmOk")}
        cancelLabel={t("reservation.cancel")}
        danger={Boolean(pendingAction?.danger)}
        pending={mutation.isPending}
        onClose={() => {
          if (!mutation.isPending) setPendingAction(null);
        }}
        onConfirm={() => pendingAction?.run()}
      />
    </div>
  );
}
