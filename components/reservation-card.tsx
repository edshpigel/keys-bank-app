"use client";

import { ArrowRight, KeyRound, Luggage, Search, Vault } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import type { ReservationListItem } from "@/lib/api";
import { clientHref } from "@/lib/clients";
import { cn } from "@/lib/cn";
import {
  clientDisplayName,
  formatDurationHours,
  formatMoney,
  formatTime,
  formatDateShort,
  formatTtlockPasscode,
} from "@/lib/format";
import { useI18n, useT } from "@/lib/i18n-provider";
import { reservationStatusVisual } from "@/lib/reservations";

type Props = {
  item: ReservationListItem;
  pointId: string;
  timeZone?: string;
};

export function ReservationCard({ item, pointId, timeZone }: Props) {
  const t = useT();
  const { locale } = useI18n();
  const isLuggage = item.service_type === "luggage";
  const serviceLabel = isLuggage ? t("reservation.serviceLuggage") : t("reservation.serviceKeys");
  const visual = reservationStatusVisual(item);
  const name = clientDisplayName(item.first_name, item.last_name, item.email);
  const duration = formatDurationHours(item.starts_at, item.ends_at);
  const labels =
    item.assigned_unit_labels && item.assigned_unit_labels.length > 0
      ? item.assigned_unit_labels
      : item.safe_label
        ? [item.safe_label]
        : [];
  const reservationHref = `/reservation/${item.id}/?point=${pointId}`;
  const clientLink = clientHref(item);

  return (
    <article
      className={cn(
        "relative flex flex-col gap-2.5 rounded-[14px] border p-3.5 transition active:scale-[0.99]",
        isLuggage ? "border-[#C5D6E4] bg-[#F3F7FA]" : "border-brand-border bg-white",
      )}
    >
      <Link
        href={reservationHref}
        className="absolute inset-0 rounded-[14px]"
        aria-label={`#${item.public_id}`}
      />

      <div className="relative z-10 flex items-start justify-between gap-3 pointer-events-none">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <StatusBadge
              tone={isLuggage ? "info" : "gold"}
              icon={
                isLuggage ? (
                  <Luggage className="h-3 w-3" strokeWidth={2} />
                ) : (
                  <KeyRound className="h-3 w-3" strokeWidth={2} />
                )
              }
            >
              {serviceLabel}
            </StatusBadge>
            <StatusBadge tone={visual.tone}>
              {(() => {
                const label = t(visual.labelKey);
                return label === visual.labelKey ? item.lifecycle : label;
              })()}
            </StatusBadge>
          </div>
          <Link
            href={clientLink}
            className="pointer-events-auto relative z-20 block truncate text-[15px] font-semibold text-brand-text underline-offset-2 hover:underline"
          >
            {name}
          </Link>
          <div className="truncate text-xs text-brand-text-muted">{item.email}</div>
        </div>
        <div className="shrink-0 text-right text-[15px] font-semibold text-brand-text">
          {(item.amount_ttc_cents ?? 0) > 0
            ? formatMoney(item.amount_ttc_cents, "EUR", locale)
            : `#${item.public_id}`}
          <span className="ml-0.5 text-brand-text-muted">›</span>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2 pointer-events-none">
        <div className="min-w-0 shrink-0">
          <div className="text-[13px] font-semibold text-brand-text">
            {formatDateShort(item.starts_at, locale, timeZone)}
          </div>
          <div className="text-xs text-brand-gold-dark">
            {formatTime(item.starts_at, locale, timeZone)}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 px-1">
          <span className="h-px flex-1 bg-brand-border" aria-hidden />
          <div className="flex shrink-0 flex-col items-center gap-0.5">
            <ArrowRight className="h-3.5 w-3.5 text-brand-text-muted" strokeWidth={2} />
            {duration ? (
              <span className="text-[10px] font-medium text-brand-text-muted">{duration}</span>
            ) : null}
          </div>
          <span className="h-px flex-1 bg-brand-border" aria-hidden />
        </div>
        <div className="min-w-0 shrink-0 text-right">
          <div className="text-[13px] font-semibold text-brand-text">
            {formatDateShort(item.ends_at, locale, timeZone)}
          </div>
          <div className="text-xs text-brand-gold-dark">
            {formatTime(item.ends_at, locale, timeZone)}
          </div>
        </div>
      </div>

      {labels.length > 0 ? (
        <div className="relative z-10 flex flex-col gap-1.5 pointer-events-none">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-brand-text-muted">
              {isLuggage ? t("reservation.lockers") : t("reservation.safes")}
            </span>
            {labels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-0.5 rounded-md border border-brand-border bg-white px-1.5 py-0.5 text-[11px] font-medium text-brand-text"
              >
                <Vault className="h-2.5 w-2.5 text-brand-text-muted" strokeWidth={2} />
                {label.startsWith("#") ? label : `#${label}`}
              </span>
            ))}
          </div>
          {!isLuggage && item.safe_mechanical_code ? (
            <div className="text-xs font-semibold text-brand-text">
              <span className="text-brand-text-muted">{t("reservation.safeCode")}: </span>
              {item.safe_mechanical_code}
            </div>
          ) : null}
          {!isLuggage && item.ttlock_passcode ? (
            <div className="flex items-center gap-1 text-xs font-semibold text-brand-text">
              <KeyRound className="h-3 w-3 text-brand-text-muted" strokeWidth={2} />
              <span className="text-brand-text-muted">{t("reservation.passcode")}: </span>
              {formatTtlockPasscode(item.ttlock_passcode)}
            </div>
          ) : null}
        </div>
      ) : !isLuggage && (item.safe_mechanical_code || item.ttlock_passcode) ? (
        <div className="relative z-10 flex flex-col gap-1 pointer-events-none">
          {item.safe_mechanical_code ? (
            <div className="text-xs font-semibold text-brand-text">
              <span className="text-brand-text-muted">{t("reservation.safeCode")}: </span>
              {item.safe_mechanical_code}
            </div>
          ) : null}
          {item.ttlock_passcode ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-text">
              <KeyRound className="h-3 w-3 text-brand-text-muted" strokeWidth={2} />
              <span className="text-brand-text-muted">{t("reservation.passcode")}: </span>
              {formatTtlockPasscode(item.ttlock_passcode)}
            </div>
          ) : null}
        </div>
      ) : null}

      {isLuggage && item.ttlock_passcode ? (
        <div className="relative z-10 flex items-center gap-1.5 pointer-events-none">
          <KeyRound className="h-3 w-3 text-brand-text-muted" strokeWidth={2} />
          <span className="text-xs font-semibold text-brand-text">
            {formatTtlockPasscode(item.ttlock_passcode)}
          </span>
        </div>
      ) : null}
    </article>
  );
}

export function ReservationSearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useT();
  return (
    <label className="flex h-10 w-full items-center gap-2 rounded-[10px] border border-brand-border bg-white px-3">
      <Search className="h-4 w-4 shrink-0 text-brand-text-muted" strokeWidth={2} />
      <span className="sr-only">{t("common.search")}</span>
      <input
        type="search"
        className="min-w-0 flex-1 bg-transparent text-[13px] text-brand-text outline-none placeholder:text-brand-text-muted"
        placeholder={t("reservations.searchPlaceholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
