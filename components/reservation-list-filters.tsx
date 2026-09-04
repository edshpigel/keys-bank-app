"use client";

import { useMemo, useState } from "react";

import type { ReservationFilters } from "@/lib/reservations";
import { useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

const fieldClass =
  "h-11 w-full rounded-xl border border-brand-border bg-white px-3 text-sm text-brand-text outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20";

type Props = {
  value: ReservationFilters;
  onChange: (next: ReservationFilters) => void;
  className?: string;
};

export function ReservationListFilters({ value, onChange, className }: Props) {
  const t = useT();
  const [query, setQuery] = useState(value.query);

  const statusOptions = useMemo(
    () =>
      [
        ["all", t("reservations.statusAll")],
        ["active", t("reservations.statusActive")],
        ["expired", t("reservations.statusExpired")],
        ["overstay", t("reservations.statusOverstay")],
      ] as const,
    [t],
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-brand-text-muted">
            {t("reservations.serviceFilter")}
          </span>
          <select
            className={fieldClass}
            value={value.service}
            onChange={(e) =>
              onChange({
                ...value,
                service: e.target.value as ReservationFilters["service"],
              })
            }
          >
            <option value="all">{t("reservations.serviceAll")}</option>
            <option value="keys">{t("reservations.serviceKeys")}</option>
            <option value="luggage">{t("reservations.serviceLuggage")}</option>
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-brand-text-muted">
            {t("reservations.statusFilter")}
          </span>
          <select
            className={fieldClass}
            value={value.status}
            onChange={(e) =>
              onChange({
                ...value,
                status: e.target.value as ReservationFilters["status"],
              })
            }
          >
            {statusOptions.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="sr-only">{t("common.search")}</span>
        <input
          type="search"
          className={fieldClass}
          placeholder={t("reservations.searchPlaceholder")}
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            onChange({ ...value, query: next });
          }}
        />
      </label>
    </div>
  );
}
