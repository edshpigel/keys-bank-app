"use client";

import { useEffect, useState } from "react";

import { useT } from "@/lib/i18n-provider";

export function OfflineBanner() {
  const t = useT();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[10000] bg-brand-header px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-center text-xs font-medium text-white/90"
    >
      {t("common.offlineBanner")}
    </div>
  );
}
