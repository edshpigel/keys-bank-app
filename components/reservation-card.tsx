"use client";

import { Chip } from "@heroui/react";
import Link from "next/link";

import type { ReservationListItem } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { lifecycleChipColor } from "@/lib/reservations";
import { useI18n, useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

type Props = {
  item: ReservationListItem;
  pointId: string;
  timeZone?: string;
};

export function ReservationCard({ item, pointId, timeZone }: Props) {
  const t = useT();
  const { locale } = useI18n();

  const serviceLabel =
    item.service_type === "luggage"
      ? t("reservation.serviceLuggage")
      : t("reservation.serviceKeys");

  return (
    <Link href={`/reservation/${item.id}/?point=${pointId}`}>
      <article
        className={cn(
          "rounded-2xl border border-brand-border bg-white p-4 shadow-sm transition active:scale-[0.99]",
          item.lifecycle === "overstay" && "border-red-200",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold text-brand-text">#{item.public_id}</div>
            <div className="truncate text-sm text-brand-text-muted">{item.email}</div>
          </div>
          <Chip size="sm" color={lifecycleChipColor(item.lifecycle)} variant="soft">
            <Chip.Label>{t(`lifecycle.${item.lifecycle}`)}</Chip.Label>
          </Chip>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <div>
            <dt className="text-brand-text-muted">{t("reservation.service")}</dt>
            <dd className="font-medium capitalize">{serviceLabel}</dd>
          </div>
          <div>
            <dt className="text-brand-text-muted">{t("reservation.status")}</dt>
            <dd className="font-medium">{t(`status.${item.status}`)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-brand-text-muted">{t("reservation.period")}</dt>
            <dd className="font-medium">
              {formatDateTime(item.starts_at, locale, timeZone)}
              {" → "}
              {formatDateTime(item.ends_at, locale, timeZone)}
            </dd>
          </div>
          {item.safe_label ? (
            <div>
              <dt className="text-brand-text-muted">{t("reservation.safe")}</dt>
              <dd className="font-medium">{item.safe_label}</dd>
            </div>
          ) : null}
          {item.locker_qty ? (
            <div>
              <dt className="text-brand-text-muted">{t("reservation.lockers")}</dt>
              <dd className="font-medium">{item.locker_qty}</dd>
            </div>
          ) : null}
        </dl>
      </article>
    </Link>
  );
}
