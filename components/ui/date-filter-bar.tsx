"use client";

import { Calendar, ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n-provider";

export type DatePreset = "today" | "week" | "month" | "custom";

type DateFilterBarProps = {
  dateLabel: string;
  preset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  onPickDate?: () => void;
  className?: string;
};

export function DateFilterBar({
  dateLabel,
  preset,
  onPresetChange,
  onPickDate,
  className,
}: DateFilterBarProps) {
  const t = useT();

  const presets: Array<{ key: DatePreset; label: string }> = [
    { key: "today", label: t("reservations.dateToday") },
    { key: "week", label: t("reservations.dateWeek") },
    { key: "month", label: t("reservations.dateMonth") },
  ];

  return (
    <div
      className={cn(
        "flex w-full items-center gap-2 rounded-[14px] border border-brand-border bg-white/95 px-3 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.08)] backdrop-blur-md",
        className,
      )}
    >
      <button
        type="button"
        onClick={onPickDate}
        className="inline-flex min-w-0 shrink-0 items-center gap-2 rounded-[10px] px-1 py-1 text-left"
      >
        <Calendar className="h-4 w-4 shrink-0 text-[#A8894E]" strokeWidth={2} />
        <span className="truncate text-[13px] font-medium text-brand-text">{dateLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-brand-text-muted" strokeWidth={2} />
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        {presets.map((item) => {
          const active = preset === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onPresetChange(item.key)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs transition",
                active
                  ? "bg-[#F5EFE3] font-semibold text-[#A8894E]"
                  : "bg-transparent font-normal text-brand-text-muted",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
