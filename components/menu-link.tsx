import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";

type MenuLinkProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  className?: string;
};

export function MenuLink({ href, label, icon: Icon, className }: MenuLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-[14px] border border-brand-border bg-white px-3.5 py-3.5 text-[15px] font-semibold text-brand-text transition active:scale-[0.99]",
        className,
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-cream text-brand-gold-dark">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">{label}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-brand-text-muted" strokeWidth={2} />
    </Link>
  );
}
