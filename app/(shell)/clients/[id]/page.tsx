"use client";

import { Alert, Spinner } from "@heroui/react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { ClientActivityList } from "@/components/client-activity-list";
import { ClientBookingActions } from "@/components/client-booking-actions";
import { SoftCard } from "@/components/ui/soft-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";
import type { ClientDetailResponse } from "@/lib/clients";
import {
  clientDisplayName,
  clientInitials,
  formatDateShort,
  formatTime,
} from "@/lib/format";
import { formatBookingsCount } from "@/lib/i18n";
import { useI18n, useT } from "@/lib/i18n-provider";
import { reservationStatusVisual } from "@/lib/reservations";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-text-muted">
      {children}
    </h2>
  );
}

export default function ClientDetailPage() {
  const t = useT();
  const { locale } = useI18n();
  const params = useParams<{ id: string }>();
  const clientRef = decodeURIComponent(params.id || "");

  const { data, isLoading, error } = useQuery({
    queryKey: ["operator", "client", clientRef],
    queryFn: () =>
      api.get<ClientDetailResponse>(`clients/${encodeURIComponent(clientRef)}`),
    enabled: Boolean(clientRef),
  });

  const client = data?.client;
  const name = client
    ? clientDisplayName(client.first_name, client.last_name, client.email)
    : "";
  const initials = client
    ? clientInitials(client.first_name, client.last_name, client.email)
    : "";

  return (
    <>
      <AppBreadcrumbs
        items={[
          { label: t("nav.clients"), href: "/clients/" },
          { label: name || t("clients.detailTitle") },
        ]}
        backHref="/clients/"
        backSide="end"
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-brand-gold" />
        </div>
      ) : null}

      {error ? <Alert status="danger">{t("clients.loadError")}</Alert> : null}

      {client ? (
        <SoftCard accent="gold" className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-gold text-base font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold text-brand-text">{name}</div>
            <div className="truncate text-xs text-brand-text-muted">{client.email}</div>
            {client.phone_e164 ? (
              <div className="truncate text-xs text-brand-text-muted">{client.phone_e164}</div>
            ) : null}
            <div className="mt-1 text-[11px] text-brand-text-muted">
              {formatBookingsCount(client.reservations_count, locale, t)}
            </div>
          </div>
        </SoftCard>
      ) : null}

      {data ? (
        <div className="flex flex-col gap-4 pb-2">
          <div className="space-y-2">
            <SectionLabel>{t("clients.sectionBookings")}</SectionLabel>
            <ul className="flex flex-col gap-3">
              {data.reservations.map((item) => {
                const visual = reservationStatusVisual(item);
                return (
                  <li key={item.id}>
                    <SoftCard>
                      <Link
                        href={`/reservation/${item.id}/?point=${item.point_id}`}
                        className="flex items-center justify-between gap-3 transition active:scale-[0.99]"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge tone={item.service_type === "luggage" ? "info" : "gold"}>
                              {item.service_type === "luggage"
                                ? t("reservation.serviceLuggage")
                                : t("reservation.serviceKeys")}
                            </StatusBadge>
                            <StatusBadge tone={visual.tone}>
                              {(() => {
                                const label = t(visual.labelKey);
                                return label === visual.labelKey ? item.lifecycle : label;
                              })()}
                            </StatusBadge>
                          </div>
                          <div className="mt-1 text-[13px] font-semibold text-brand-text">
                            #{item.public_id}
                          </div>
                          <div className="text-xs text-brand-text-muted">
                            {formatDateShort(item.starts_at, locale)}{" "}
                            {formatTime(item.starts_at, locale)}
                            {" → "}
                            {formatDateShort(item.ends_at, locale)}{" "}
                            {formatTime(item.ends_at, locale)}
                          </div>
                          {item.assigned_unit_labels && item.assigned_unit_labels.length > 0 ? (
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              {item.assigned_unit_labels.map((label) => (
                                <span
                                  key={label}
                                  className="inline-flex rounded-md bg-brand-cream px-1.5 py-0.5 text-[11px] font-semibold text-brand-gold-dark"
                                >
                                  {label.startsWith("#") ? label : `#${label}`}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          {item.ttlock_passcode ? (
                            <div className="mt-1 text-[11px] text-brand-text">
                              TTLock: <span className="font-semibold">{item.ttlock_passcode}</span>
                            </div>
                          ) : null}
                        </div>
                        <span className="text-brand-text-muted">›</span>
                      </Link>
                      <ClientBookingActions
                        reservationId={item.id}
                        pointId={item.point_id}
                        status={item.status}
                        phoneE164={client?.phone_e164}
                        actions={item.actions}
                      />
                    </SoftCard>
                  </li>
                );
              })}
              {data.reservations.length === 0 ? (
                <p className="py-6 text-center text-sm text-brand-text-muted">
                  {t("clients.noBookings")}
                </p>
              ) : null}
            </ul>
          </div>

          <div className="space-y-2">
            <SectionLabel>{t("clients.sectionActivity")}</SectionLabel>
            <ClientActivityList items={data.activity ?? []} />
          </div>
        </div>
      ) : null}
    </>
  );
}
