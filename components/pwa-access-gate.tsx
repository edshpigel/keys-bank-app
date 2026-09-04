"use client";

import { useEffect, useState } from "react";

import { OfflineBanner } from "@/components/offline-banner";
import { PwaInstallGate } from "@/components/pwa-install-gate";
import { shouldShowPwaInstallGate } from "@/lib/pwa";
import { initTelegramUi } from "@/lib/telegram";

export function PwaAccessGate({ children }: { children: React.ReactNode }) {
  const [showGate, setShowGate] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    initTelegramUi();
    setShowGate(shouldShowPwaInstallGate());
    setChecked(true);

    let timeoutId = 0;
    const hideSplash = () => {
      document.documentElement.classList.add("app-ready");
      initTelegramUi();
    };

    if (document.readyState === "complete") {
      timeoutId = window.setTimeout(hideSplash, 0);
    } else {
      window.addEventListener("load", hideSplash, { once: true });
      timeoutId = window.setTimeout(hideSplash, 2500);
    }

    const poll = window.setInterval(() => {
      initTelegramUi();
      setShowGate(shouldShowPwaInstallGate());
      if (window.Telegram?.WebApp) window.clearInterval(poll);
    }, 200);
    const stopPoll = window.setTimeout(() => window.clearInterval(poll), 4000);

    return () => {
      window.removeEventListener("load", hideSplash);
      window.clearTimeout(timeoutId);
      window.clearInterval(poll);
      window.clearTimeout(stopPoll);
    };
  }, []);

  return (
    <>
      <OfflineBanner />
      {children}
      {checked && showGate ? (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-brand-cream">
          <PwaInstallGate />
        </div>
      ) : null}
    </>
  );
}
