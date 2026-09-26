"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";
import { useSheetPresence } from "@/lib/use-sheet-presence";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Accessible label for the backdrop dismiss control */
  closeLabel: string;
  /** Disable backdrop / ESC close while a mutation is running */
  closeDisabled?: boolean;
  className?: string;
  panelClassName?: string;
  zIndexClassName?: string;
};

export function BottomSheet({
  open,
  onClose,
  children,
  closeLabel,
  closeDisabled = false,
  className,
  panelClassName,
  zIndexClassName = "z-[10050]",
}: BottomSheetProps) {
  const { mounted, visible } = useSheetPresence(open);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || closeDisabled) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, closeDisabled, onClose]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 flex items-end justify-center sm:items-center sm:p-4",
        zIndexClassName,
        className,
      )}
    >
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out",
          visible ? "opacity-100" : "opacity-0",
        )}
        aria-label={closeLabel}
        disabled={closeDisabled}
        onClick={() => {
          if (!closeDisabled) onClose();
        }}
        data-overlay
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "safe-bottom relative z-10 w-full max-w-md rounded-t-2xl bg-white shadow-xl sm:rounded-2xl",
          "kb-sheet-panel",
          visible ? "kb-sheet-panel--in" : "kb-sheet-panel--out",
          panelClassName,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
