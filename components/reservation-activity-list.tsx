"use client";

import { Spinner } from "@heroui/react";
import {
  CheckCircle2,
  ChevronDown,
  CreditCard,
  KeyRound,
  Mail,
  MessageSquare,
  Unlock,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { SoftCard } from "@/components/ui/soft-card";
import { api, type ReservationActivityItem } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useI18n, useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

function activityIcon(type: string) {
  if (type.startsWith("payment.")) return CreditCard;
  if (type.startsWith("notify.email") || type === "operator.resend_email" || type === "operator.custom_email") {
    return Mail;
  }
  if (type.startsWith("notify.sms") || type === "operator.resend_sms" || type === "operator.custom_sms") {
    return MessageSquare;
  }
  if (type === "access.passcode_synced" || type === "operator.ttlock_refresh") return KeyRound;
  if (type === "access.lock_opened") return Unlock;
  if (type === "hardware.action") return Wrench;
  if (type === "operator.cancel_auto_renew") return CheckCircle2;
  if (type.startsWith("lifecycle.") || type.startsWith("operator.")) return CheckCircle2;
  return CreditCard;
}

function activityIconTone(type: string) {
  if (type === "lifecycle.takeout") return "bg-[#E8F5EC] text-[#2D8A4E]";
  if (type === "access.lock_opened") return "bg-[#E8F0FA] text-[#3B6EA5]";
  if (type === "operator.cancel_auto_renew") return "bg-[#FCE8E6] text-[#B42318]";
  if (type.startsWith("operator.")) return "bg-brand-cream text-brand-gold-dark";
  if (type.startsWith("notify.")) return "bg-brand-cream text-brand-gold-dark";
  return "bg-brand-cream text-brand-gold-dark";
}

function ActivityRow({
  item,
  timeZone,
}: {
  item: ReservationActivityItem;
  timeZone?: string;
}) {
  const t = useT();
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const Icon = activityIcon(item.type);
  const title = (() => {
    const label = t(item.title_key);
    return label === item.title_key ? item.type : label;
  })();

  return (
    <li className="border-b border-brand-border last:border-b-0">
      <button
        type="button"
        disabled={!item.expandable}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left",
          item.expandable ? "cursor-pointer" : "cursor-default",
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            activityIconTone(item.type),
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-brand-text">{title}</div>
          {item.subtitle ? (
            <div className="text-[11px] text-brand-text-muted">{item.subtitle}</div>
          ) : null}
          {item.at ? (
            <div className="mt-0.5 text-[10px] text-brand-text-muted">
              {formatDateTime(item.at, locale, timeZone)}
            </div>
          ) : null}
          {open && item.body_preview ? (
            <p className="mt-2 whitespace-pre-wrap rounded-[8px] bg-brand-cream/60 px-2.5 py-2 text-[11px] text-brand-text-muted">
              {item.body_preview}
            </p>
          ) : null}
        </div>
        {item.expandable ? (
          <ChevronDown
            className={cn(
              "mt-1 h-4 w-4 shrink-0 text-brand-text-muted transition",
              open ? "rotate-180" : "",
            )}
            strokeWidth={2}
          />
        ) : null}
      </button>
    </li>
  );
}

export function ReservationActivityList({
  reservationId,
  timeZone,
}: {
  reservationId: string;
  timeZone?: string;
}) {
  const t = useT();
  const { data, isLoading, error } = useQuery({
    queryKey: ["operator", "reservation-activity", reservationId],
    queryFn: () =>
      api.get<{ items: ReservationActivityItem[] }>(`reservations/${reservationId}/activity`),
    enabled: Boolean(reservationId),
  });

  if (isLoading) {
    return (
      <SoftCard className="flex justify-center py-6">
        <Spinner size="sm" className="text-brand-gold" />
      </SoftCard>
    );
  }

  if (error) {
    return (
      <SoftCard>
        <p className="px-1 py-2 text-sm text-brand-text-muted">{t("reservation.activityLoadError")}</p>
      </SoftCard>
    );
  }

  const items = data?.items ?? [];

  return (
    <SoftCard padding="none">
      <ul>
        {items.map((item) => (
          <ActivityRow key={item.id} item={item} timeZone={timeZone} />
        ))}
        {items.length === 0 ? (
          <li className="px-3.5 py-4 text-center text-sm text-brand-text-muted">
            {t("reservation.activityEmpty")}
          </li>
        ) : null}
      </ul>
    </SoftCard>
  );
}
