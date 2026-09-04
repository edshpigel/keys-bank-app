"use client";

import { Button } from "@heroui/react";
import { ChevronLeft, LogOut } from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n-provider";
import { useAppNavigation } from "@/lib/navigation";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  showLogout?: boolean;
  className?: string;
};

export function AppHeader({
  title,
  subtitle,
  backHref,
  showLogout = false,
  className,
}: AppHeaderProps) {
  const t = useT();
  const { navigate } = useAppNavigation();

  async function onLogout() {
    await api.auth.logout().catch(() => undefined);
    navigate("/login/", { replace: true });
  }

  return (
    <header className={cn("flex items-center gap-2.5 pb-3 pt-1", className)}>
      {backHref ? (
        <Link
          href={backHref}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl text-brand-text/80 transition hover:bg-black/5"
          aria-label={t("common.back")}
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
      ) : null}

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-extrabold tracking-tight text-brand-text">{title}</h1>
        {subtitle ? (
          <p className="truncate text-xs text-brand-text-muted">{subtitle}</p>
        ) : null}
      </div>

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
      ) : (
        <BrandLogo size="sm" />
      )}
    </header>
  );
}
