"use client";

import { Button, Chip } from "@heroui/react";
import { ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";

import { ApiError, api, type PaymentListItem, type ReservationListItem } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { paymentKindLabel, paymentStatusColor } from "@/lib/payments";
import { useI18n, useT } from "@/lib/i18n-provider";

type Props = {
  payment: PaymentListItem;
  reservation?: ReservationListItem;
  pointId: string;
};

export function PaymentCard({ payment, reservation, pointId }: Props) {
  const t = useT();
  const { locale } = useI18n();

  const receipt = useMutation({
    mutationFn: () => api.get<{ url: string }>(`payments/${payment.id}/receipt`),
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
    },
  });

  const statusLabel =
    payment.status === "paid"
      ? t("payments.statusPaid")
      : payment.status === "refunded"
        ? t("payments.statusRefunded")
        : payment.status;

  return (
    <article className="rounded-[14px] border border-brand-border bg-white p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold tabular-nums text-brand-text">
            {formatMoney(payment.amount_ttc_cents, payment.currency || "EUR", locale)}
          </div>
          {reservation ? (
            <div className="truncate text-xs text-brand-text-muted">
              #{reservation.public_id} · {reservation.email}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Chip size="sm" variant="soft" color={paymentStatusColor(payment.status)}>
            <Chip.Label>{statusLabel}</Chip.Label>
          </Chip>
          <Chip size="sm" variant="soft">
            <Chip.Label>{paymentKindLabel(payment.kind, t)}</Chip.Label>
          </Chip>
        </div>
      </div>

      {payment.tariff_code ? (
        <p className="mt-2 text-xs text-brand-text-muted">{payment.tariff_code}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/reservation/${payment.reservation_id}/?point=${pointId}`}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-cream px-3 py-2 text-sm font-medium text-brand-gold-dark"
        >
          {t("payments.openBooking")}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <Button
          variant="secondary"
          className="h-9 gap-1 px-3 text-sm"
          isDisabled={receipt.isPending || payment.status === "refunded"}
          onPress={() => receipt.mutate()}
        >
          <FileText className="h-4 w-4" />
          {receipt.isPending ? t("common.loading") : t("payments.receipt")}
        </Button>
      </div>

      {receipt.isError ? (
        <p className="mt-2 text-xs text-[#C0392B]">
          {receipt.error instanceof ApiError ? receipt.error.message : t("payments.receiptError")}
        </p>
      ) : null}
    </article>
  );
}
