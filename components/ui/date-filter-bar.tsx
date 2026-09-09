"use client";

import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { CalendarDate, type DateValue } from "@internationalized/date";
import { RangeCalendar } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n-provider";
import type { DatePreset } from "@/lib/reservations";

type DateFilterBarProps = {
  dateFromLabel: string;
  dateToLabel?: string | null;
  preset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  onApplyCustomRange: (from: string, to: string) => void;
  fromValue: string;
  toValue: string;
  className?: string;
};

function parseIsoDay(value: string | undefined | null): CalendarDate | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return new CalendarDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

function toIsoDay(value: DateValue) {
  const y = value.year;
  const m = String(value.month).padStart(2, "0");
  const d = String(value.day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayCalendarDate() {
  const now = new Date();
  return new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function DateFilterBar({
  dateFromLabel,
  dateToLabel,
  preset,
  onPresetChange,
  onApplyCustomRange,
  fromValue,
  toValue,
  className,
}: DateFilterBarProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const initialRange = useMemo(() => {
    const from = parseIsoDay(fromValue) ?? todayCalendarDate();
    const to = parseIsoDay(toValue) ?? from;
    return { start: from, end: to };
  }, [fromValue, toValue]);
  const [draft, setDraft] = useState(initialRange);

  useEffect(() => {
    if (!open) return;
    setDraft(initialRange);
  }, [open, initialRange]);

  const presets: Array<{ key: DatePreset; label: string }> = [
    { key: "all", label: t("reservations.dateAllShort") },
    { key: "today", label: t("reservations.dateToday") },
    { key: "week", label: t("reservations.dateWeek") },
    { key: "month", label: t("reservations.dateMonth") },
  ];

  const isRange = Boolean(dateToLabel && dateToLabel !== dateFromLabel);
  const canApply = Boolean(draft.start && draft.end);

  return (
    <>
      <div
        className={cn(
          "flex w-full items-center gap-2 rounded-[14px] border border-brand-border bg-white/95 px-3 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.08)] backdrop-blur-md",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-w-0 flex-1 items-start gap-2 rounded-[10px] px-1 py-0.5 text-left"
        >
          <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#A8894E]" strokeWidth={2} />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-medium leading-tight text-brand-text">
              {dateFromLabel}
            </span>
            {isRange ? (
              <span className="mt-0.5 block text-[12px] font-medium leading-tight text-brand-text-muted">
                → {dateToLabel}
              </span>
            ) : null}
          </span>
          <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-text-muted" strokeWidth={2} />
        </button>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          {presets.map((item) => {
            const active = preset === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onPresetChange(item.key)}
                className={cn(
                  "rounded-lg px-1.5 py-1.5 text-[10px] transition sm:px-2 sm:text-xs",
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

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label={t("common.back")}
            onClick={() => setOpen(false)}
            data-overlay
          />
          <div
            role="dialog"
            aria-modal="true"
            className="safe-bottom relative z-10 w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
          >
            <h2 className="text-lg font-semibold text-brand-text">
              {t("reservations.dateRangeTitle")}
            </h2>
            <p className="mt-1 text-sm text-brand-text-muted">
              {t("reservations.dateRangeHint")}
            </p>

            <div className="mt-4 flex justify-center">
              <RangeCalendar
                aria-label={t("reservations.dateRangeTitle")}
                value={draft}
                onChange={(next) => {
                  if (!next?.start || !next?.end) return;
                  setDraft({ start: next.start, end: next.end });
                }}
                className="w-full max-w-[320px]"
              >
                <RangeCalendar.Header className="mb-2 flex items-center justify-between gap-2">
                  <RangeCalendar.Heading className="text-sm font-semibold text-brand-text" />
                  <div className="flex items-center gap-1">
                    <RangeCalendar.NavButton slot="previous" />
                    <RangeCalendar.NavButton slot="next" />
                  </div>
                </RangeCalendar.Header>
                <RangeCalendar.Grid className="w-full">
                  <RangeCalendar.GridHeader>
                    {(day) => (
                      <RangeCalendar.HeaderCell className="text-[11px] text-brand-text-muted">
                        {day}
                      </RangeCalendar.HeaderCell>
                    )}
                  </RangeCalendar.GridHeader>
                  <RangeCalendar.GridBody>
                    {(date) => <RangeCalendar.Cell date={date} />}
                  </RangeCalendar.GridBody>
                </RangeCalendar.Grid>
              </RangeCalendar>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="h-11 flex-1 rounded-[12px] border border-brand-border bg-white text-sm font-semibold text-brand-text"
                onClick={() => setOpen(false)}
              >
                {t("reservation.cancel")}
              </button>
              <button
                type="button"
                className="h-11 flex-1 rounded-[12px] bg-brand-gold text-sm font-semibold text-white disabled:opacity-50"
                disabled={!canApply}
                onClick={() => {
                  if (!draft.start || !draft.end) return;
                  onApplyCustomRange(toIsoDay(draft.start), toIsoDay(draft.end));
                  setOpen(false);
                }}
              >
                {t("reservations.dateApply")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
