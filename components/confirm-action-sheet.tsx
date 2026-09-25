"use client";

import { Button, Spinner } from "@heroui/react";

import { useT } from "@/lib/i18n-provider";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmActionSheet({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger = false,
  pending = false,
  onConfirm,
  onClose,
}: Props) {
  const t = useT();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label={cancelLabel ?? t("reservation.cancel")}
        disabled={pending}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl",
          "safe-bottom",
        )}
      >
        <h2 className="text-lg font-semibold text-brand-text">{title}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-brand-text-muted">{description}</p>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant={danger ? "danger" : "primary"}
            isDisabled={pending}
            onPress={onConfirm}
            className="w-full"
          >
            {pending ? <Spinner size="sm" /> : (confirmLabel ?? t("reservation.confirmOk"))}
          </Button>
          <Button variant="secondary" isDisabled={pending} onPress={onClose} className="w-full">
            {cancelLabel ?? t("reservation.cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
