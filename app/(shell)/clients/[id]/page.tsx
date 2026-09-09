"use client";

import { Alert, Spinner } from "@heroui/react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { AppHeader } from "@/components/app-header";
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
import { useI18n, useT } from "@/lib/i18n-provider";
import { reservationStatusVisual } from "@/lib/reservations";
import Link from "next/link";

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
      <AppHeader
        title={name || t("clients.detailTitle")}
        subtitle={client?.email}
        backHref="/clients/"
        backSide="start"
        size="lg"
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
              {t("clients.bookingsCount", { count: client.reservations_count })}
            </div>
          </div>
        </SoftCard>
      ) : null}

      {data ? (
        <ul className="flex flex-col gap-2.5 pb-2">
          {data.reservations.map((item) => {
            const visual = reservationStatusVisual(item);
            return (
              <li key={item.id}>
                <Link href={`/reservation/${item.id}/?point=${item.point_id}`}>
                  <SoftCard className="flex items-center justify-between gap-3 transition active:scale-[0.99]">
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
                    </div>
                    <span className="text-brand-text-muted">›</span>
                  </SoftCard>
                </Link>
              </li>
            );
          })}
          {data.reservations.length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-text-muted">
              {t("clients.noBookings")}
            </p>
          ) : null}
        </ul>
      ) : null}
    </>
  );
}
