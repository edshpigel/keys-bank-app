"use client";

import {
  CheckCircle2,
  ChevronDown,
  CreditCard,
  KeyRound,
  Mail,
  MessageSquare,
  Package,
  Unlock,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { SoftCard } from "@/components/ui/soft-card";
import type { ClientActivityItem } from "@/lib/clients";
import { formatDateTime } from "@/lib/format";
import { useI18n, useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

export type { ClientActivityItem };

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
  if (type === "lifecycle.deposit") return Package;
  if (type.startsWith("lifecycle.") || type.startsWith("operator.")) return CheckCircle2;
  return CreditCard;
}

function activityIconTone(type: string) {
  if (type === "lifecycle.takeout" || type === "lifecycle.deposit") return "bg-[#E8F5EC] text-[#2D8A4E]";
  if (type === "access.lock_opened") return "bg-[#E8F0FA] text-[#3B6EA5]";
  if (type === "operator.cancel_auto_renew") return "bg-[#FCE8E6] text-[#B42318]";
  if (type.startsWith("operator.")) return "bg-brand-cream text-brand-gold-dark";
  if (type.startsWith("notify.")) return "bg-brand-cream text-brand-gold-dark";
  return "bg-brand-cream text-brand-gold-dark";
}

function ActivityRow({ item }: { item: ClientActivityItem }) {
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
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-brand-text-muted">
            {item.at ? <span>{formatDateTime(item.at, locale)}</span> : null}
            {item.public_id != null && item.reservation_id ? (
              <Link
                href={`/reservation/${item.reservation_id}/`}
                className="font-medium text-brand-gold"
                onClick={(e) => e.stopPropagation()}
              >
                #{item.public_id}
              </Link>
            ) : null}
          </div>
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

export function ClientActivityList({ items }: { items: ClientActivityItem[] }) {
  const t = useT();

  return (
    <SoftCard padding="none">
      <ul>
        {items.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
        {items.length === 0 ? (
          <li className="px-3.5 py-4 text-center text-sm text-brand-text-muted">
            {t("clients.activityEmpty")}
          </li>
        ) : null}
      </ul>
    </SoftCard>
  );
}
