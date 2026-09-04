"use client";

import { Button } from "@heroui/react";
import { useEffect } from "react";

import { reportClientError } from "@/lib/client-log";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      kind: "react-boundary",
      message: error.message || "React render error",
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-brand-cream px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 text-center shadow-lg">
        <h1 className="text-lg font-extrabold text-brand-text">Une erreur est survenue</h1>
        <p className="mt-2 text-sm text-brand-text-muted">
          L&apos;incident a été enregistré. Réessayez ou reconnectez-vous.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="primary" onPress={() => reset()}>
            Réessayer
          </Button>
          <Button variant="ghost" onPress={() => window.location.assign("/login/")}>
            Connexion
          </Button>
        </div>
      </div>
    </div>
  );
}
