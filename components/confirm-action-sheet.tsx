"use client";

import { Button, Spinner } from "@heroui/react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useT } from "@/lib/i18n-provider";

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
  const cancel = cancelLabel ?? t("reservation.cancel");

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      closeLabel={cancel}
      closeDisabled={pending}
      zIndexClassName="z-50"
    >
      <div className="p-5">
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
            {cancel}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
