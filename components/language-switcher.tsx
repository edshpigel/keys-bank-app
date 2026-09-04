"use client";

/* eslint-disable @next/next/no-img-element */

import { Dropdown } from "@heroui/react";

import { ClientOnly } from "@/components/client-only";
import { LOCALE_META, LOCALES, type Locale } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  compact?: boolean;
  variant?: "light" | "dark";
};

function SwitcherTrigger({
  className,
  compact,
  variant = "light",
  current,
}: {
  className?: string;
  compact?: boolean;
  variant?: "light" | "dark";
  current: (typeof LOCALE_META)[Locale];
}) {
  return (
    <span
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border px-2.5 text-sm font-medium",
        variant === "light"
          ? "border-brand-border bg-white text-brand-text"
          : "border-white/15 bg-white/5 text-white",
        className,
      )}
    >
      <img src={current.flag} alt="" width={18} height={18} className="rounded-sm" />
      <span>{compact ? current.short : current.label}</span>
    </span>
  );
}

export function LanguageSwitcher({
  className,
  compact,
  variant = "light",
}: Props) {
  const { locale, setLocale, t } = useI18n();
  const current = LOCALE_META[locale];

  const triggerClass = cn(
    "inline-flex h-9 items-center gap-2 rounded-full border px-2.5 text-sm font-medium outline-none transition-colors",
    variant === "light"
      ? "border-brand-border bg-white text-brand-text data-[hovered=true]:bg-brand-cream"
      : "border-white/15 bg-white/5 text-white data-[hovered=true]:bg-white/10",
    className,
  );

  return (
    <ClientOnly
      fallback={
        <SwitcherTrigger
          className={className}
          compact={compact}
          variant={variant}
          current={current}
        />
      }
    >
      <Dropdown className={className}>
        <Dropdown.Trigger aria-label={t("common.language")} className={triggerClass}>
          <img src={current.flag} alt="" width={18} height={18} className="rounded-sm" />
          <span>{compact ? current.short : current.label}</span>
        </Dropdown.Trigger>
        <Dropdown.Popover placement="bottom end" className="min-w-[168px]">
          <Dropdown.Menu
            aria-label={t("common.language")}
            selectionMode="single"
            selectedKeys={new Set([locale])}
            onAction={(key) => setLocale(String(key) as Locale)}
          >
            {LOCALES.map((code) => {
              const meta = LOCALE_META[code];
              return (
                <Dropdown.Item key={code} id={code} textValue={meta.label}>
                  <div className="flex items-center gap-2.5">
                    <img src={meta.flag} alt="" width={18} height={18} className="rounded-sm" />
                    <span>{meta.label}</span>
                  </div>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
              );
            })}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </ClientOnly>
  );
}
