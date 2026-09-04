"use client";

import { Button } from "@heroui/react";

import { useT } from "@/lib/i18n-provider";
import type { StatisticsFilters, StatisticsService } from "@/lib/statistics";

const PRESETS = [7, 30, 90, 365] as const;

const PRESET_LABELS: Record<(typeof PRESETS)[number], "stats.preset7" | "stats.preset30" | "stats.preset90" | "stats.preset365"> = {
  7: "stats.preset7",
  30: "stats.preset30",
  90: "stats.preset90",
  365: "stats.preset365",
};

const fieldClass =
  "h-11 w-full rounded-xl border border-brand-border bg-white px-3 text-sm text-brand-text outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20";

type Props = {
  value: StatisticsFilters;
  activePreset: number | null;
  onPreset: (days: number) => void;
  onChange: (next: StatisticsFilters) => void;
  onApply: () => void;
  loading?: boolean;
};

export function StatsFiltersPanel({ value, activePreset, onPreset, onChange, onApply, loading }: Props) {
  const t = useT();

  return (
    <div className="space-y-3 rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-text-muted">{t("stats.period")}</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((days) => (
            <Button
              key={days}
              variant={activePreset === days ? "primary" : "secondary"}
              onPress={() => onPreset(days)}
            >
              {t(PRESET_LABELS[days])}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-brand-text-muted">{t("stats.dateFrom")}</span>
          <input
            type="date"
            className={fieldClass}
            value={value.dateFrom}
            onChange={(e) => onChange({ ...value, dateFrom: e.target.value })}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-brand-text-muted">{t("stats.dateTo")}</span>
          <input
            type="date"
            className={fieldClass}
            value={value.dateTo}
            onChange={(e) => onChange({ ...value, dateTo: e.target.value })}
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-brand-text-muted">{t("stats.serviceFilter")}</span>
        <select
          className={fieldClass}
          value={value.service}
          onChange={(e) => onChange({ ...value, service: e.target.value as StatisticsService })}
        >
          <option value="all">{t("stats.serviceAll")}</option>
          <option value="keys">{t("stats.serviceKeys")}</option>
          <option value="luggage">{t("stats.serviceLuggage")}</option>
        </select>
      </label>

      <Button variant="primary" className="w-full" onPress={onApply} isDisabled={loading}>
        {t("stats.apply")}
      </Button>
    </div>
  );
}
