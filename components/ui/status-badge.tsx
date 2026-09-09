import { cn } from "@/lib/cn";

type Tone = "success" | "danger" | "warning" | "neutral" | "info" | "gold";

const tones: Record<Tone, string> = {
  success: "bg-[#E8F5EC] text-[#2D8A4E]",
  danger: "bg-[#FDECEA] text-[#C0392B]",
  warning: "bg-[#FFF4E5] text-[#B86A1A]",
  neutral: "bg-[#F0EEEA] text-[#6B6560]",
  info: "bg-[#E8F1F7] text-[#3D6B8E]",
  gold: "bg-[#F5EFE3] text-[#A8894E]",
};

type StatusBadgeProps = {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  icon?: React.ReactNode;
};

export function StatusBadge({ children, tone = "neutral", className, icon }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
