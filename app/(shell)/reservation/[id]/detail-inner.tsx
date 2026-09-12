"use client";

import { Alert, Spinner } from "@heroui/react";
import {
  ChevronRight,
  KeyRound,
  Luggage,
  Vault,
} from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { ReservationActionsPanel } from "@/components/reservation-actions-panel";
import { ReservationActivityList } from "@/components/reservation-activity-list";
import { SectionLabel, SoftCard } from "@/components/ui/soft-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { api, type PointListItem, type ReservationDetail } from "@/lib/api";
import { clientHref } from "@/lib/clients";
import {
  clientDisplayName,
  clientInitials,
  formatDateTime,
  formatDurationHours,
  formatMoney,
  formatTime,
  formatDateShort,
  formatTtlockPasscode,
} from "@/lib/format";
import { useI18n, useT } from "@/lib/i18n-provider";
import { reservationStatusVisual } from "@/lib/reservations";

export default function ReservationDetailInner() {
  const t = useT();
  const { locale } = useI18n();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const pointId = searchParams.get("point") || "";
  const reservationId = params.id;

  const { data: points } = useQuery({
    queryKey: ["operator", "points"],
    queryFn: () => api.get<PointListItem[]>("points"),
  });
  const point = points?.find((p) => p.id === pointId);

  const { data, isLoading, error } = useQuery({
    queryKey: ["operator", "reservation", reservationId],
    queryFn: () => api.get<ReservationDetail>(`reservations/${reservationId}`),
    enabled: Boolean(reservationId),
  });

  const backHref = pointId ? `/point/${pointId}/reservations/` : "/points/";
  const clientName = data
    ? clientDisplayName(data.first_name, data.last_name, data.email)
    : "";
  const initials = data
    ? clientInitials(data.first_name, data.last_name, data.email)
    : "";
  const isLuggage = data?.service_type === "luggage";
  const visual = data ? reservationStatusVisual(data) : null;
  const duration = data ? formatDurationHours(data.starts_at, data.ends_at) : "";
  const labels =
    data?.assigned_unit_labels && data.assigned_unit_labels.length > 0
      ? data.assigned_unit_labels
      : data?.safe_label
        ? [data.safe_label]
        : [];
  const address = [point?.name_short, point?.city].filter(Boolean).join(", ");

  return (
    <>
      <AppHeader
        title={data ? `#${data.public_id}` : t("reservation.title")}
        backHref={backHref}
        backSide="start"
        size="md"
        trailing={
          visual ? (
            <StatusBadge tone={visual.tone} className="shrink-0">
              {(() => {
                const label = t(visual.labelKey);
                return label === visual.labelKey ? data?.lifecycle : label;
              })()}
            </StatusBadge>
          ) : null
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-brand-gold" />
        </div>
      ) : null}

      {error ? <Alert status="danger">{t("reservation.loadError")}</Alert> : null}

      {data ? (
        <div className="flex w-full flex-col gap-3 pb-4">
          <SoftCard className="flex flex-col gap-3" accent={isLuggage ? "luggage" : "default"}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
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
                    {isLuggage
                      ? t("reservation.serviceLuggage")
                      : t("reservation.serviceKeys")}
                  </StatusBadge>
                  {visual ? (
                    <StatusBadge tone={visual.tone}>
                      {(() => {
                        const label = t(visual.labelKey);
                        return label === visual.labelKey ? data.lifecycle : label;
                      })()}
                    </StatusBadge>
                  ) : null}
                </div>
                <div className="text-lg font-semibold text-brand-text">{clientName}</div>
                <div className="text-[13px] text-brand-text-muted">
                  {formatDateShort(data.starts_at, locale, point?.timezone)}
                  {" · "}
                  {formatTime(data.starts_at, locale, point?.timezone)}–
                  {formatTime(data.ends_at, locale, point?.timezone)}
                  {duration ? ` · ${duration}` : ""}
                </div>
                {data.created_at ? (
                  <div className="text-[10px] text-brand-text-muted">
                    {t("reservation.created")} {formatDateTime(data.created_at, locale, point?.timezone)}
                  </div>
                ) : null}
              </div>
              <div className="shrink-0 text-xl font-bold text-brand-text">
                {data.amount_ttc_cents > 0
                  ? formatMoney(data.amount_ttc_cents, "EUR", locale)
                  : null}
              </div>
            </div>
          </SoftCard>

          <div className="space-y-2">
            <SectionLabel>{t("reservation.sectionContact")}</SectionLabel>
            <Link href={clientHref(data)} className="block">
              <SoftCard accent="gold" className="flex items-center gap-3 transition active:scale-[0.99]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-gold text-base font-semibold text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold text-brand-text">
                    {clientName}
                  </div>
                  <div className="truncate text-xs text-brand-text-muted">{data.email}</div>
                  {data.phone_e164 ? (
                    <div className="truncate text-xs text-brand-text-muted">{data.phone_e164}</div>
                  ) : null}
                  <div className="mt-0.5 text-[10px] font-medium text-brand-gold-dark">
                    {t("reservation.tapClient")}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-brand-gold-dark" strokeWidth={2} />
              </SoftCard>
            </Link>
          </div>

          <div className="space-y-2">
            <SectionLabel>{t("reservation.sectionLocks")}</SectionLabel>
            <SoftCard className="space-y-2.5">
              {labels.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-brand-text-muted">
                    {isLuggage ? t("reservation.lockers") : t("reservation.safes")}
                  </span>
                  {labels.map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 rounded-md bg-brand-cream px-2 py-1 text-[11px] font-semibold text-brand-gold-dark"
                    >
                      <Vault className="h-2.5 w-2.5" strokeWidth={2} />
                      {label.startsWith("#") || label.startsWith("L") ? label : `#${label}`}
                    </span>
                  ))}
                </div>
              ) : null}

              {data.safe_mechanical_code ? (
                <div className="flex items-center justify-between rounded-[10px] bg-brand-cream px-3 py-2.5">
                  <span className="text-[11px] text-brand-text-muted">{t("reservation.safeCode")}</span>
                  <span className="text-lg font-bold text-brand-text">{data.safe_mechanical_code}</span>
                </div>
              ) : null}

              {data.ttlock_passcode ? (
                <div className="flex items-center justify-between rounded-[10px] bg-brand-header px-3 py-2.5">
                  <span className="text-[11px] text-white/50">{t("reservation.passcode")}</span>
                  <span className="text-lg font-bold text-brand-gold">
                    {formatTtlockPasscode(data.ttlock_passcode)}
                  </span>
                </div>
              ) : null}

              {address ? (
                <div className="text-xs text-brand-text-muted">{address}</div>
              ) : null}
            </SoftCard>
          </div>

          <div className="space-y-2">
            <SectionLabel>{t("reservation.sectionActivity")}</SectionLabel>
            <ReservationActivityList
              reservationId={reservationId}
              timeZone={point?.timezone}
            />
          </div>

          <ReservationActionsPanel
            reservationId={reservationId}
            detail={data}
            timeZone={point?.timezone}
          />
        </div>
      ) : null}
    </>
  );
}
