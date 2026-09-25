"use client";

import { useEffect, useState } from "react";

import { OfflineBanner } from "@/components/offline-banner";
import { PwaInstallGate } from "@/components/pwa-install-gate";
import { shouldShowPwaInstallGate } from "@/lib/pwa";
import { initTelegramUi, isTelegramWebApp } from "@/lib/telegram";

export function PwaAccessGate({ children }: { children: React.ReactNode }) {
  const [showGate, setShowGate] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    initTelegramUi();

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

    const applyGate = () => {
      // Never flash the install screen inside Telegram while the SDK is still loading.
      if (isTelegramWebApp()) {
        setShowGate(false);
        setChecked(true);
        return true;
      }
      return false;
    };

    if (applyGate()) {
      return () => {
        window.removeEventListener("load", hideSplash);
        window.clearTimeout(timeoutId);
      };
    }

    // telegram-web-app.js is afterInteractive — wait briefly for it before deciding.
    const poll = window.setInterval(() => {
      initTelegramUi();
      if (applyGate()) {
        window.clearInterval(poll);
        return;
      }
      // Script present with no Telegram signals → regular browser.
      if (window.Telegram?.WebApp && !isTelegramWebApp()) {
        setShowGate(shouldShowPwaInstallGate());
        setChecked(true);
        window.clearInterval(poll);
      }
    }, 100);

    const stopPoll = window.setTimeout(() => {
      window.clearInterval(poll);
      if (!isTelegramWebApp()) {
        setShowGate(shouldShowPwaInstallGate());
      } else {
        setShowGate(false);
      }
      setChecked(true);
    }, 2500);

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
