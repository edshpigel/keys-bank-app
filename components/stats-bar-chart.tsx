"use client";

import { cn } from "@/lib/cn";

export function StatsBarChart({
  labels,
  values,
  formatValue,
  barClassName = "bg-brand-gold/80",
}: {
  labels: string[];
  values: number[];
  formatValue?: (value: number) => string;
  barClassName?: string;
}) {
  const max = Math.max(...values, 1);

  return (
    <div className="overflow-x-auto pb-1">
      <div
        className="flex h-44 min-w-full items-end gap-1 px-1 pt-2"
        style={{ minWidth: `${Math.max(labels.length * 20, 280)}px` }}
      >
        {labels.map((label, i) => {
          const value = values[i] ?? 0;
          const h = Math.max(6, Math.round((value / max) * 140));
          return (
            <div key={`${label}-${i}`} className="flex min-w-[18px] flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-brand-text">{formatValue ? formatValue(value) : value}</span>
              <div className={cn("w-full max-w-4 rounded-t-md", barClassName)} style={{ height: h }} title={`${label}: ${value}`} />
              <span className="w-full truncate text-center text-[9px] leading-tight text-brand-text-muted">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function formatSeriesLabels(labels: string[], locale: string) {
  return labels.map((label) => {
    const d = new Date(`${label}T00:00:00`);
    if (Number.isNaN(d.getTime())) return label;
    return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
  });
}

export function thinSeriesLabels(labels: string[], locale: string, maxTicks = 8) {
  const formatted = formatSeriesLabels(labels, locale);
  if (formatted.length <= maxTicks) return formatted;
  const step = Math.ceil(formatted.length / maxTicks);
  return formatted.map((label, i) => (i % step === 0 || i === formatted.length - 1 ? label : ""));
}
