"use client";

import { KeyRound, Luggage } from "lucide-react";
import type { ReactNode } from "react";

import { FilterChip } from "@/components/ui/filter-chip";
import { useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

export type ServiceFilterValue = "all" | "keys" | "luggage";

type Props = {
  value: ServiceFilterValue;
  onChange: (next: ServiceFilterValue) => void;
  allowedServices?: Array<"keys" | "luggage">;
  /** When false, hide the "All" chip (useful when only one service is allowed). */
  showAll?: boolean;
  className?: string;
  size?: "sm" | "md";
};

export function ServiceFilterChips({
  value,
  onChange,
  allowedServices,
  showAll = true,
  className,
  size = "sm",
}: Props) {
  const t = useT();
  const allowed = new Set(allowedServices ?? ["keys", "luggage"]);

  const services: Array<{
    key: ServiceFilterValue;
    label: string;
    icon?: ReactNode;
  }> = [
    ...(showAll && allowed.size > 1
      ? [{ key: "all" as const, label: t("reservations.serviceAll") }]
      : []),
    ...(allowed.has("keys")
      ? [
          {
            key: "keys" as const,
            label: t("reservations.serviceKeys"),
            icon: <KeyRound className="h-3 w-3 text-brand-gold-dark" strokeWidth={2} />,
          },
        ]
      : []),
    ...(allowed.has("luggage")
      ? [
          {
            key: "luggage" as const,
            label: t("reservations.serviceLuggage"),
            icon: <Luggage className="h-3 w-3 text-[#3D6B8E]" strokeWidth={2} />,
          },
        ]
      : []),
  ];

  if (services.length <= 1) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {services.map((item) => (
        <FilterChip
          key={item.key}
          size={size}
          active={value === item.key}
          onClick={() => onChange(item.key)}
        >
          {item.icon && value !== item.key ? item.icon : null}
          {item.label}
        </FilterChip>
      ))}
    </div>
  );
}

type ServiceBadgesProps = {
  services: Array<"keys" | "luggage">;
  className?: string;
};

/** Compact read-only badges for lists (points list). */
export function ServiceAccessBadges({ services, className }: ServiceBadgesProps) {
  const t = useT();
  if (!services.length) return null;

  return (
    <div className={cn("mt-1.5 flex flex-wrap gap-1", className)}>
      {services.includes("keys") ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-brand-border bg-brand-cream/80 px-2 py-0.5 text-[11px] font-medium text-brand-text">
          <KeyRound className="h-3 w-3 text-brand-gold-dark" strokeWidth={2} />
          {t("reservations.serviceKeys")}
        </span>
      ) : null}
      {services.includes("luggage") ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-brand-border bg-brand-cream/80 px-2 py-0.5 text-[11px] font-medium text-brand-text">
          <Luggage className="h-3 w-3 text-[#3D6B8E]" strokeWidth={2} />
          {t("reservations.serviceLuggage")}
        </span>
      ) : null}
    </div>
  );
}
