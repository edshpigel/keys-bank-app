"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import type { UnitReservationItem } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  formatDateShort,
  formatDurationHours,
  formatTime,
} from "@/lib/format";
import { useI18n, useT } from "@/lib/i18n-provider";
import { reservationStatusVisual } from "@/lib/reservations";

type Props = {
  item: UnitReservationItem;
  pointId: string;
  timeZone?: string;
  onNavigate?: () => void;
};

export function UnitReservationRow({ item, pointId, timeZone, onNavigate }: Props) {
  const t = useT();
  const { locale } = useI18n();
  const visual = reservationStatusVisual(item);
  const highlighted = item.lifecycle === "active" || item.lifecycle === "overstay";
  const hasRange = Boolean(item.starts_at && item.ends_at);
  const duration =
    item.starts_at && item.ends_at ? formatDurationHours(item.starts_at, item.ends_at) : "";

  return (
    <Link
      href={`/reservation/${item.id}/?point=${pointId}`}
      onClick={onNavigate}
      className={cn(
        "block rounded-[14px] border px-3.5 py-3 active:scale-[0.99]",
        highlighted
          ? item.lifecycle === "overstay"
            ? "border-[#E8A5A0] bg-[#FDECEA] ring-1 ring-[#C0392B]/20"
            : "border-[#A8C4D8] bg-[#E8F1F7] ring-1 ring-[#3D6B8E]/15"
          : "border-brand-border bg-brand-cream",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-brand-text">#{item.public_id}</div>
          <div className="mt-1">
            <StatusBadge tone={visual.tone}>
              {(() => {
                const label = t(visual.labelKey);
                return label === visual.labelKey ? t(`lifecycle.${item.lifecycle}`) : label;
              })()}
            </StatusBadge>
          </div>
        </div>
        <div className="shrink-0 text-right text-xs capitalize text-brand-text-muted">
          {t(`status.${item.status}`)}
        </div>
      </div>

      {item.client_name || item.email ? (
        <div className="mt-1.5 truncate text-xs text-brand-text-muted">
          {item.client_name || item.email}
        </div>
      ) : null}

      {hasRange ? (
        <div className="mt-2.5 flex items-center gap-2">
          <div className="min-w-0 shrink-0">
            <div className="text-[13px] font-semibold text-brand-text">
              {formatDateShort(item.starts_at!, locale, timeZone)}
            </div>
            <div className="text-xs text-brand-gold-dark">
              {formatTime(item.starts_at!, locale, timeZone)}
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
              {formatDateShort(item.ends_at!, locale, timeZone)}
            </div>
            <div className="text-xs text-brand-gold-dark">
              {formatTime(item.ends_at!, locale, timeZone)}
            </div>
          </div>
        </div>
      ) : null}
    </Link>
  );
}
