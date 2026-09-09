"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type FilterChipProps = {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md";
};

export function FilterChip({
  active = false,
  onClick,
  children,
  className,
  size = "md",
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap border transition",
        size === "sm" ? "rounded-2xl px-3 py-1.5 text-xs" : "rounded-[20px] px-3.5 py-2 text-[13px]",
        active
          ? "border-transparent bg-brand-gold font-semibold text-white"
          : "border-brand-border bg-white font-normal text-brand-text",
        className,
      )}
    >
      {children}
    </button>
  );
}
