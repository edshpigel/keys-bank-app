"use client";

import { ChevronLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/cn";
import { redirectToLogout } from "@/lib/auth-client";
import { useT } from "@/lib/i18n-provider";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  showLogout?: boolean;
  /** Match pen-dev: list screens put chevron on the right */
  backSide?: "start" | "end";
  size?: "md" | "lg";
  className?: string;
  trailing?: React.ReactNode;
};

export function AppHeader({
  title,
  subtitle,
  backHref,
  showLogout = false,
  backSide = "start",
  size = "md",
  className,
  trailing,
}: AppHeaderProps) {
  const t = useT();
  const [loggingOut, setLoggingOut] = useState(false);

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

  const titleBlock = (
    <div className="min-w-0 flex-1">
      <h1
        className={cn(
          "truncate font-bold tracking-tight text-brand-text",
          size === "lg" ? "text-[28px] leading-tight" : "text-[22px] leading-tight",
        )}
      >
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-0.5 truncate text-sm text-brand-text-muted">{subtitle}</p>
      ) : null}
    </div>
  );

  return (
    <header className={cn("flex items-center gap-2 pb-1 pt-1", className)}>
      {backHref && backSide === "start" ? backLink : null}
      {titleBlock}
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
