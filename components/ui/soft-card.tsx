import { cn } from "@/lib/cn";

type SoftCardProps = {
  children: React.ReactNode;
  className?: string;
  accent?: "default" | "gold" | "luggage";
  padding?: "sm" | "md" | "none";
};

export function SoftCard({
  children,
  className,
  accent = "default",
  padding = "md",
}: SoftCardProps) {
  return (
    <div
      className={cn(
        "rounded-[14px] border",
        accent === "default" && "border-brand-border bg-white",
        accent === "gold" && "border-brand-gold bg-white",
        accent === "luggage" && "border-[#C5D6E4] bg-[#F3F7FA]",
        padding === "md" && "p-3.5",
        padding === "sm" && "p-3",
        padding === "none" && "p-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "text-[11px] font-semibold tracking-[1px] text-brand-text-muted uppercase",
        className,
      )}
    >
      {children}
    </div>
  );
}
