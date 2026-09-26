"use client";

import { FilterChip } from "@/components/ui/filter-chip";
import { ReservationSearchField } from "@/components/reservation-card";
import { ServiceFilterChips } from "@/components/service-filter-chips";
import type { ReservationFilters } from "@/lib/reservations";
import { useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

type Props = {
  value: ReservationFilters;
  onChange: (next: ReservationFilters) => void;
  allowedServices?: Array<"keys" | "luggage">;
  className?: string;
};

export function ReservationListFilters({ value, onChange, allowedServices, className }: Props) {
  const t = useT();

  const statuses = [
    { key: "all" as const, label: t("reservations.statusAll") },
    { key: "active" as const, label: t("reservations.statusActive") },
    { key: "overstay" as const, label: t("reservations.statusOverstay") },
    { key: "expired" as const, label: t("reservations.statusExpired") },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <ServiceFilterChips
        value={value.service}
        onChange={(service) => onChange({ ...value, service })}
        allowedServices={allowedServices}
      />

      <div className="flex flex-wrap gap-1.5">
        {statuses.map((item) => (
          <FilterChip
            key={item.key}
            active={value.status === item.key}
            onClick={() => onChange({ ...value, status: item.key })}
          >
            {item.label}
          </FilterChip>
        ))}
      </div>

      <ReservationSearchField
        value={value.query}
        onChange={(query) => onChange({ ...value, query })}
      />
    </div>
  );
}
