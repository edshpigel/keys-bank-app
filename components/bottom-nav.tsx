"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, User, Users } from "lucide-react";

import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n-provider";

const tabs = [
  { href: "/points/", labelKey: "nav.points", icon: MapPin },
  { href: "/clients/", labelKey: "nav.clients", icon: Users },
  { href: "/profile/", labelKey: "nav.profile", icon: User },
] as const;

export function BottomNav() {
  const t = useT();
  const pathname = usePathname();

  return (
    <nav className="flex justify-center" aria-label="Main navigation">
      <div className="flex h-14 items-stretch gap-1 rounded-[28px] bg-white/80 p-1 shadow-[0_4px_12px_rgba(0,0,0,0.09)] backdrop-blur-md">
        {tabs.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname.startsWith(href.replace(/\/$/, ""));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex w-[100px] flex-col items-center justify-center gap-0.5 rounded-3xl text-[10px] leading-tight transition sm:w-[120px]",
                active
                  ? "bg-brand-gold font-semibold text-white"
                  : "bg-transparent font-normal text-brand-text-muted",
              )}
              style={
                active
                  ? { color: "#ffffff", WebkitTextFillColor: "#ffffff" }
                  : undefined
              }
            >
              <Icon
                className={cn("h-5 w-5", active ? "text-white" : "text-brand-text-muted")}
                strokeWidth={2}
                style={active ? { color: "#ffffff" } : undefined}
              />
              <span
                className={active ? "text-white" : "text-brand-text-muted"}
                style={
                  active
                    ? { color: "#ffffff", WebkitTextFillColor: "#ffffff" }
                    : undefined
                }
              >
                {t(labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
