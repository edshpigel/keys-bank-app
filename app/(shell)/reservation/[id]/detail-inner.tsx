"use client";

import { Alert, Card, Chip, Spinner } from "@heroui/react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { AppHeader } from "@/components/app-header";
import { PageCard } from "@/components/page-card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ReservationActionsPanel } from "@/components/reservation-actions-panel";
import { api, type PointListItem, type ReservationDetail } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import { lifecycleChipColor } from "@/lib/reservations";
import { useI18n, useT } from "@/lib/i18n-provider";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-brand-text-muted">{label}</dt>
      <dd className="mt-1 font-medium text-brand-text">{value}</dd>
    </div>
  );
}

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
  const clientName = [data?.first_name, data?.last_name].filter(Boolean).join(" ");

  return (
    <>
      <AppHeader
        title={t("reservation.title")}
        subtitle={data ? `#${data.public_id}` : undefined}
        backHref={backHref}
      />
      <PageCard tight className="flex-1 space-y-4">
        <div className="flex justify-end">
          <LanguageSwitcher compact />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" className="text-brand-gold" />
          </div>
        ) : null}

        {error ? <Alert status="danger">{t("reservation.loadError")}</Alert> : null}

        {data ? (
          <>
            <Card className="border border-brand-border bg-white">
              <Card.Content className="space-y-4 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip size="sm" color={lifecycleChipColor(data.lifecycle)} variant="soft">
                    <Chip.Label>{t(`lifecycle.${data.lifecycle}`)}</Chip.Label>
                  </Chip>
                  <Chip size="sm" variant="soft">
                    <Chip.Label>{t(`status.${data.status}`)}</Chip.Label>
                  </Chip>
                  {data.access_status ? (
                    <Chip size="sm" variant="soft" color="accent">
                      <Chip.Label>
                        {(() => {
                          const key = `accessStatus.${data.access_status}`;
                          const label = t(key);
                          return label === key ? data.access_status : label;
                        })()}
                      </Chip.Label>
                    </Chip>
                  ) : null}
                </div>

                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailRow label={t("reservation.publicId")} value={`#${data.public_id}`} />
                  <DetailRow
                    label={t("reservation.service")}
                    value={
                      data.service_type === "luggage"
                        ? t("reservation.serviceLuggage")
                        : t("reservation.serviceKeys")
                    }
                  />
                  <DetailRow label={t("reservation.email")} value={data.email} />
                  <DetailRow label={t("reservation.phone")} value={data.phone_e164} />
                  <DetailRow label={t("reservation.name")} value={clientName} />
                  <DetailRow label={t("reservation.safe")} value={data.safe_label} />
                  <DetailRow label={t("reservation.lockers")} value={data.locker_qty} />
                  <DetailRow label={t("reservation.passcode")} value={data.ttlock_passcode} />
                  <DetailRow
                    label={t("reservation.period")}
                    value={
                      <>
                        {formatDateTime(data.starts_at, locale, point?.timezone)}
                        {" → "}
                        {formatDateTime(data.ends_at, locale, point?.timezone)}
                      </>
                    }
                  />
                </dl>
              </Card.Content>
            </Card>

            {data.payments.length > 0 ? (
              <Card className="border border-brand-border bg-white">
                <Card.Content className="p-5">
                  <h2 className="mb-3 font-semibold">{t("reservation.payments")}</h2>
                  <ul className="space-y-2">
                    {data.payments.map((payment) => (
                      <li
                        key={payment.id}
                        className="flex items-center justify-between rounded-xl bg-brand-cream px-3 py-2 text-sm"
                      >
                        <span className="capitalize">
                          {payment.kind}
                          {payment.status === "refunded" ? " · refunded" : ""}
                        </span>
                        <span className="font-medium tabular-nums">
                          {formatMoney(payment.amount_ttc_cents, "EUR", locale)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card.Content>
              </Card>
            ) : null}

            <ReservationActionsPanel
              reservationId={reservationId}
              detail={data}
              timeZone={point?.timezone}
            />
          </>
        ) : null}
      </PageCard>
    </>
  );
}
