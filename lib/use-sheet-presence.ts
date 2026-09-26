"use client";

import { useEffect, useState } from "react";

const EXIT_MS = 280;

/** Keeps a sheet mounted through the exit animation. */
export function useSheetPresence(open: boolean, exitMs = EXIT_MS) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setVisible(true));
      });
      return () => window.cancelAnimationFrame(id);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), exitMs);
    return () => window.clearTimeout(timer);
  }, [open, exitMs]);

  return { mounted, visible };
}
