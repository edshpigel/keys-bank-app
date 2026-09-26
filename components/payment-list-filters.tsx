"use client";

import { useMemo, useState } from "react";

import { FilterChip } from "@/components/ui/filter-chip";
import { ServiceFilterChips } from "@/components/service-filter-chips";
import type { PaymentFilters } from "@/lib/payments";
import { useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

const fieldClass =
  "h-10 w-full rounded-[10px] border border-brand-border bg-white px-3 text-sm text-brand-text outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20";

type Props = {
  value: PaymentFilters;
  onChange: (next: PaymentFilters) => void;
  allowedServices?: Array<"keys" | "luggage">;
  className?: string;
};

export function PaymentListFilters({ value, onChange, allowedServices, className }: Props) {
  const t = useT();
  const [query, setQuery] = useState(value.query);

  const kindOptions = useMemo(
    () =>
      [
        ["all", t("payments.kindAll")],
        ["initial", t("payments.kindInitial")],
        ["extend", t("payments.kindExtend")],
      ] as const,
    [t],
  );

  const statusOptions = useMemo(
    () =>
      [
        ["all", t("payments.statusAll")],
        ["paid", t("payments.statusPaid")],
        ["refunded", t("payments.statusRefunded")],
      ] as const,
    [t],
  );

  return (
    <div className={cn("space-y-3", className)}>
      <ServiceFilterChips
        value={value.service}
        onChange={(service) => onChange({ ...value, service })}
        allowedServices={allowedServices}
      />

      <div className="flex flex-wrap gap-1.5">
        {kindOptions.map(([key, label]) => (
          <FilterChip
            key={key}
            size="sm"
            active={value.kind === key}
            onClick={() => onChange({ ...value, kind: key })}
          >
            {label}
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {statusOptions.map(([key, label]) => (
          <FilterChip
            key={key}
            size="sm"
            active={value.status === key}
            onClick={() => onChange({ ...value, status: key })}
          >
            {label}
          </FilterChip>
        ))}
      </div>

      <label className="block">
        <span className="sr-only">{t("common.search")}</span>
        <input
          type="search"
          className={fieldClass}
          placeholder={t("payments.searchPlaceholder")}
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
