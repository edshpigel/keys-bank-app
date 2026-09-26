"use client";

import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/cn";
import { redirectToLogout } from "@/lib/auth-client";
import { useT } from "@/lib/i18n-provider";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type AppBreadcrumbsProps = {
  items: BreadcrumbItem[];
  /** Optional trailing back chevron (list-style) */
  backHref?: string;
  backSide?: "start" | "end";
  showLogout?: boolean;
  trailing?: React.ReactNode;
  className?: string;
};

export function AppBreadcrumbs({
  items,
  backHref,
  backSide = "end",
  showLogout = false,
  trailing,
  className,
}: AppBreadcrumbsProps) {
  const t = useT();
  const [loggingOut, setLoggingOut] = useState(false);
  const crumbs = items.filter((item) => item.label.trim());

  function onLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    redirectToLogout();
  }

  const backLink = backHref ? (
    <Link
      href={backHref}
      className="flex h-9 w-9 shrink-0 items-center justify-center text-brand-text transition hover:opacity-70"
      aria-label={t("common.back")}
    >
      <ChevronLeft className="h-6 w-6" strokeWidth={2} />
    </Link>
  ) : null;

  return (
    <header className={cn("flex items-center gap-2 pb-1 pt-1", className)}>
      {backHref && backSide === "start" ? backLink : null}

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
          {crumbs.map((item, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
                {index > 0 ? (
                  <ChevronRight
                    className="h-3.5 w-3.5 shrink-0 text-brand-text-muted/70"
                    strokeWidth={2}
                    aria-hidden
                  />
                ) : null}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="truncate text-[13px] font-medium text-brand-text-muted transition hover:text-brand-gold-dark"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "truncate",
                      isLast
                        ? "text-[17px] font-bold tracking-tight text-brand-text sm:text-[20px]"
                        : "text-[13px] font-medium text-brand-text-muted",
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {trailing}
      {backHref && backSide === "end" ? backLink : null}
      {showLogout ? (
        <button
          type="button"
          aria-label={t("common.logout")}
          disabled={loggingOut}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-text-muted transition hover:bg-black/5 hover:text-brand-text disabled:opacity-50"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5" />
        </button>
      ) : null}
    </header>
  );
}
