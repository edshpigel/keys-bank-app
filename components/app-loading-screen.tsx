"use client";

import { Spinner } from "@heroui/react";

type Props = {
  message?: string;
  className?: string;
  /** Pure CSS spinner — works before HeroUI hydrates. */
  native?: boolean;
};

export function AppLoadingScreen({ message, className, native = false }: Props) {
  return (
    <div
      className={`flex min-h-dvh flex-col items-center justify-center gap-4 bg-brand-header px-6 text-white ${className ?? ""}`}
    >
      <div className="font-display text-3xl tracking-wide text-brand-gold">KeysBank</div>
      {native ? (
        <div className="kb-boot-splash__spinner" aria-hidden />
      ) : (
        <Spinner size="lg" className="text-brand-gold" />
      )}
      {message ? <p className="text-center text-sm text-white/75">{message}</p> : null}
    </div>
  );
}
