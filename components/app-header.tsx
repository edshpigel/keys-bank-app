"use client";

import { Button } from "@heroui/react";
import { ChevronLeft, LogOut } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n-provider";
import { useAppNavigation } from "@/lib/navigation";

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
  const { navigate } = useAppNavigation();

  async function onLogout() {
    await api.auth.logout().catch(() => undefined);
    navigate("/login/", { replace: true });
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
        <Button
          isIconOnly
          variant="ghost"
          aria-label={t("common.logout")}
          className="shrink-0 text-brand-text-muted"
          onPress={onLogout}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      ) : null}
    </header>
  );
}
