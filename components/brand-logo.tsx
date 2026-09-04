import { cn } from "@/lib/cn";

/* Raw <img>: next/image optimizer breaks the logo in Telegram / PWA navigations. */
/* eslint-disable @next/next/no-img-element */

type BrandLogoProps = {
  size?: "sm" | "lg";
  className?: string;
};

const sizes = {
  sm: { width: 140, height: 53, className: "h-10 w-auto" },
  lg: { width: 220, height: 84, className: "h-14 w-auto" },
} as const;

export function BrandLogo({ size = "sm", className }: BrandLogoProps) {
  const cfg = sizes[size];
  return (
    <img
      src="/logo.png"
      alt="Keys-Bank & Luggage"
      width={cfg.width}
      height={cfg.height}
      className={cn("kb-logo shrink-0 object-contain object-right", cfg.className, className)}
      draggable={false}
    />
  );
}
