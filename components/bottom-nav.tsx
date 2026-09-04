"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, UserRound } from "lucide-react";

import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n-provider";

const tabs = [
  { href: "/points/", labelKey: "nav.points", icon: MapPin },
  { href: "/profile/", labelKey: "nav.profile", icon: UserRound },
] as const;

export function BottomNav() {
  const t = useT();
  const pathname = usePathname();

  return (
    <nav
      className="mt-4 flex gap-1.5 rounded-full border border-black/10 bg-white/70 p-1.5 backdrop-blur-md"
      aria-label="Main navigation"
    >
      {tabs.map(({ href, labelKey, icon: Icon }) => {
        const active = pathname.startsWith(href.replace(/\/$/, ""));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 py-2 text-[10px] font-semibold leading-tight transition",
              active
                ? "bg-gradient-to-b from-[#c3a164] to-brand-gold text-white shadow-sm"
                : "text-brand-text/70 hover:text-brand-text",
            )}
          >
            <Icon className={cn("h-[18px] w-[18px]", active ? "text-white" : "text-brand-text/65")} />
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
