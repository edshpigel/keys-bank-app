import { cn } from "@/lib/cn";

type PageCardProps = {
  children: React.ReactNode;
  className?: string;
  tight?: boolean;
  /** Flat soft card on cream canvas (pen-dev). Default true. */
  soft?: boolean;
};

export function PageCard({ children, className, tight, soft = true }: PageCardProps) {
  return (
    <section
      className={cn(
        soft
          ? "rounded-[14px] border border-brand-border bg-white"
          : "rounded-[22px] border border-black/10 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.12)]",
        tight ? "p-3.5" : "p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}
