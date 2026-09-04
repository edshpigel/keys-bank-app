import { cn } from "@/lib/cn";

type PageCardProps = {
  children: React.ReactNode;
  className?: string;
  tight?: boolean;
};

export function PageCard({ children, className, tight }: PageCardProps) {
  return (
    <section
      className={cn(
        "rounded-[22px] border border-black/10 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.12)]",
        tight ? "p-3.5" : "p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}
