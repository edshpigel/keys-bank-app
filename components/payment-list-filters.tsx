"use client";

import { useMemo, useState } from "react";

import type { PaymentFilters } from "@/lib/payments";
import { useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

const fieldClass =
  "h-11 w-full rounded-xl border border-brand-border bg-white px-3 text-sm text-brand-text outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20";

type Props = {
  value: PaymentFilters;
  onChange: (next: PaymentFilters) => void;
  className?: string;
};

export function PaymentListFilters({ value, onChange, className }: Props) {
  const t = useT();
  const [query, setQuery] = useState(value.query);

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
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-brand-text-muted">{t("payments.kindFilter")}</span>
          <select
            className={fieldClass}
            value={value.kind}
            onChange={(e) =>
              onChange({ ...value, kind: e.target.value as PaymentFilters["kind"] })
            }
          >
            <option value="all">{t("payments.kindAll")}</option>
            <option value="initial">{t("payments.kindInitial")}</option>
            <option value="extend">{t("payments.kindExtend")}</option>
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-brand-text-muted">{t("payments.statusFilter")}</span>
          <select
            className={fieldClass}
            value={value.status}
            onChange={(e) =>
              onChange({ ...value, status: e.target.value as PaymentFilters["status"] })
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
