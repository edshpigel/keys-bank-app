import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type ListRowProps = {
  href: string;
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  className?: string;
};

export function ListRow({ href, title, subtitle, leading, className }: ListRowProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-[14px] border border-brand-border bg-white px-3.5 py-3.5 transition active:scale-[0.99]",
        className,
      )}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold leading-snug text-brand-text">{title}</div>
        {subtitle ? (
          <div className="mt-0.5 text-xs text-brand-text-muted">{subtitle}</div>
        ) : null}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-brand-text-muted" strokeWidth={2} />
    </Link>
  );
}
