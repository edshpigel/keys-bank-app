"use client";

import { useEffect } from "react";

import { reportClientError } from "@/lib/client-log";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      kind: "react-boundary",
      message: error.message || "Global React error",
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="fr">
      <body className="bg-brand-cream font-sans antialiased">
        <div className="flex min-h-dvh items-center justify-center px-4 py-8">
          <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 text-center shadow-lg">
            <h1 className="text-lg font-extrabold text-[#141414]">Une erreur est survenue</h1>
            <p className="mt-2 text-sm text-[#686868]">
              L&apos;incident a été enregistré. Réessayez ou reconnectez-vous.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                className="rounded-xl bg-[#b69955] px-4 py-2.5 text-sm font-semibold text-white"
                onClick={() => reset()}
              >
                Réessayer
              </button>
              <button
                type="button"
                className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-[#141414]"
                onClick={() => window.location.assign("/login/")}
              >
                Connexion
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
