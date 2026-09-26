"use client";

import { ExternalLink, FileText, KeyRound, Luggage } from "lucide-react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";

import { ApiError, api, type PaymentListItem } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import { paymentKindLabel } from "@/lib/payments";
import { useI18n, useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

type Props = {
  payment: PaymentListItem;
  pointId: string;
  timeZone?: string;
};

export function PaymentCard({ payment, pointId, timeZone }: Props) {
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

  const stamp = payment.paid_at || payment.created_at;
  const publicId = payment.reservation_public_id;
  const email = payment.reservation_email;
  const service = payment.service_type;
  const isRefunded = payment.status === "refunded";

  return (
    <article className="rounded-[14px] border border-brand-border bg-white px-3.5 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[16px] font-bold tabular-nums tracking-tight text-brand-text">
              {formatMoney(payment.amount_ttc_cents, payment.currency || "EUR", locale)}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                isRefunded
                  ? "bg-[#F8E8D8] text-[#9A5B2F]"
                  : payment.status === "paid"
                    ? "bg-[#E5F5EA] text-[#1F7A3F]"
                    : "bg-brand-cream text-brand-text-muted",
              )}
            >
              {statusLabel}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-brand-text-muted">
            {stamp ? (
              <time dateTime={stamp} className="font-medium text-brand-text/80">
                {formatDateTime(stamp, locale, timeZone)}
              </time>
            ) : null}
            <span aria-hidden>·</span>
            <span>{paymentKindLabel(payment.kind, t)}</span>
            {service ? (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  {service === "keys" ? (
                    <KeyRound className="h-3 w-3 text-brand-gold-dark" strokeWidth={2} />
                  ) : (
                    <Luggage className="h-3 w-3 text-[#3D6B8E]" strokeWidth={2} />
                  )}
                  {service === "keys" ? t("stats.serviceKeys") : t("stats.serviceLuggage")}
                </span>
              </>
            ) : null}
          </div>

          {(publicId || email) && (
            <p className="mt-1 truncate text-[12px] text-brand-text-muted">
              {publicId ? `#${publicId}` : null}
              {publicId && email ? " · " : null}
              {email || null}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href={`/reservation/${payment.reservation_id}/?point=${pointId}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border bg-brand-cream text-brand-gold-dark transition active:scale-95"
            aria-label={t("payments.openBooking")}
            title={t("payments.openBooking")}
          >
            <ExternalLink className="h-4 w-4" strokeWidth={2} />
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border bg-white text-brand-text transition active:scale-95 disabled:opacity-40"
            aria-label={t("payments.receipt")}
            title={t("payments.receipt")}
            disabled={receipt.isPending || isRefunded}
            onClick={() => receipt.mutate()}
          >
            <FileText className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {receipt.isError ? (
        <p className="mt-2 text-[11px] text-[#C0392B]">
          {receipt.error instanceof ApiError ? receipt.error.message : t("payments.receiptError")}
        </p>
      ) : null}
    </article>
  );
}
