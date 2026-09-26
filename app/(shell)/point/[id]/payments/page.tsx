"use client";

import { Alert, Spinner } from "@heroui/react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { PaymentCard } from "@/components/payment-card";
import { PaymentListFilters } from "@/components/payment-list-filters";
import { api, type PaymentListItem, type PointListItem } from "@/lib/api";
import { filterPayments, type PaymentFilters } from "@/lib/payments";
import { useT } from "@/lib/i18n-provider";

export default function PointPaymentsPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const pointId = params.id;

  const [filters, setFilters] = useState<PaymentFilters>({
    kind: "all",
    status: "all",
    query: "",
    service: "all",
  });

  const { data: points } = useQuery({
    queryKey: ["operator", "points"],
    queryFn: () => api.get<PointListItem[]>("points"),
  });
  const point = points?.find((p) => p.id === pointId);
  const allowedServices = useMemo(
    () => point?.allowed_services ?? (["keys", "luggage"] as Array<"keys" | "luggage">),
    [point?.allowed_services],
  );

  useEffect(() => {
    if (allowedServices.length === 1) {
      setFilters((prev) =>
        prev.service === allowedServices[0] ? prev : { ...prev, service: allowedServices[0] },
      );
      return;
    }
    if (filters.service !== "all" && !allowedServices.includes(filters.service)) {
      setFilters((prev) => ({ ...prev, service: "all" }));
    }
  }, [allowedServices, filters.service]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["operator", "payments", pointId],
    queryFn: () => api.get<PaymentListItem[]>(`points/${pointId}/payments`),
    enabled: Boolean(pointId) && allowedServices.length > 0,
  });

  const items = useMemo(() => filterPayments(data ?? [], filters), [data, filters]);
  const pointName = point?.name_short || t("pointHub.titleFallback");

  return (
    <>
      <AppBreadcrumbs
        items={[
          { label: t("nav.points"), href: "/points/" },
          { label: pointName, href: `/point/${pointId}/` },
          { label: t("payments.title") },
        ]}
        backHref={`/point/${pointId}/`}
        backSide="end"
      />

      {allowedServices.length === 0 ? (
        <Alert status="danger">{t("common.accessDenied")}</Alert>
      ) : (
        <>
          <PaymentListFilters
            value={filters}
            onChange={setFilters}
            allowedServices={allowedServices}
          />

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" className="text-brand-gold" />
            </div>
          ) : null}

          {error ? <Alert status="danger">{t("payments.loadError")}</Alert> : null}

          {!isLoading && !error ? (
            <ul className="space-y-3">
              {items.map((payment) => (
                <li key={payment.id}>
                  <PaymentCard payment={payment} pointId={pointId} timeZone={point?.timezone} />
                </li>
              ))}
              {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-brand-text-muted">{t("payments.empty")}</p>
              ) : null}
            </ul>
          ) : null}
        </>
      )}
    </>
  );
}
