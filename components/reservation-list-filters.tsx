"use client";

import { KeyRound, Luggage } from "lucide-react";

import { FilterChip } from "@/components/ui/filter-chip";
import { ReservationSearchField } from "@/components/reservation-card";
import type { ReservationFilters } from "@/lib/reservations";
import { useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

type Props = {
  value: ReservationFilters;
  onChange: (next: ReservationFilters) => void;
  className?: string;
};

export function ReservationListFilters({ value, onChange, className }: Props) {
  const t = useT();

  const services = [
    { key: "all" as const, label: t("reservations.serviceAll") },
    {
      key: "keys" as const,
      label: t("reservations.serviceKeys"),
      icon: <KeyRound className="h-3 w-3 text-brand-gold-dark" strokeWidth={2} />,
    },
    {
      key: "luggage" as const,
      label: t("reservations.serviceLuggage"),
      icon: <Luggage className="h-3 w-3 text-[#3D6B8E]" strokeWidth={2} />,
    },
  ];

  const statuses = [
    { key: "all" as const, label: t("reservations.statusAll") },
    { key: "active" as const, label: t("reservations.statusActive") },
    { key: "overstay" as const, label: t("reservations.statusOverstay") },
    { key: "expired" as const, label: t("reservations.statusExpired") },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-1.5">
        {services.map((item) => (
          <FilterChip
            key={item.key}
            size="sm"
            active={value.service === item.key}
            onClick={() => onChange({ ...value, service: item.key })}
          >
            {"icon" in item && value.service !== item.key ? item.icon : null}
            {item.label}
          </FilterChip>
        ))}
      </div>

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
