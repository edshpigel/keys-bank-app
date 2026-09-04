"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { ClientErrorReporter } from "@/components/client-error-reporter";
import { PwaAccessGate } from "@/components/pwa-access-gate";
import { I18nProvider } from "@/lib/i18n-provider";
import { NavigationProvider } from "@/lib/navigation";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (count) =>
              typeof navigator !== "undefined" && !navigator.onLine ? false : count < 1,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            networkMode: "always",
          },
          mutations: {
            networkMode: "always",
          },
        },
      }),
  );

  return (
    <I18nProvider>
      <QueryClientProvider client={client}>
        <NavigationProvider>
          <ClientErrorReporter />
          <PwaAccessGate>{children}</PwaAccessGate>
        </NavigationProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}
