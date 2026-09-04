"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n-provider";

const THRESHOLD = 56;
const MAX_PULL = 88;

type Props = {
  children: ReactNode;
  className?: string;
};

export function PullToRefresh({ children, className }: Props) {
  const t = useT();
  const queryClient = useQueryClient();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const refreshing = useRef(false);
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    function onStart(event: TouchEvent) {
      const node = scrollerRef.current;
      if (!node || refreshing.current) return;
      if (event.touches.length !== 1) return;
      if (node.scrollTop > 1) {
        pulling.current = false;
        return;
      }
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("input, textarea, select, [role='dialog'], [data-overlay]")
      ) {
        pulling.current = false;
        return;
      }
      startY.current = event.touches[0].clientY;
      pulling.current = true;
    }

    function onMove(event: TouchEvent) {
      const node = scrollerRef.current;
      if (!node || !pulling.current || refreshing.current) return;
      if (node.scrollTop > 1) {
        pulling.current = false;
        setPull(0);
        return;
      }
      const dy = event.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPull(0);
        return;
      }
      event.preventDefault();
      setPull(Math.min(dy * 0.42, MAX_PULL));
    }

    function onEnd() {
      if (!pulling.current) return;
      pulling.current = false;
      setPull((current) => {
        if (current >= THRESHOLD) {
          void runRefresh();
          return THRESHOLD;
        }
        return 0;
      });
    }

    async function runRefresh() {
      if (refreshing.current) return;
      refreshing.current = true;
      setBusy(true);
      try {
        await queryClient.invalidateQueries();
      } finally {
        refreshing.current = false;
        setBusy(false);
        setPull(0);
      }
    }

    scroller.addEventListener("touchstart", onStart, { passive: true });
    scroller.addEventListener("touchmove", onMove, { passive: false });
    scroller.addEventListener("touchend", onEnd);
    scroller.addEventListener("touchcancel", onEnd);
    return () => {
      scroller.removeEventListener("touchstart", onStart);
      scroller.removeEventListener("touchmove", onMove);
      scroller.removeEventListener("touchend", onEnd);
      scroller.removeEventListener("touchcancel", onEnd);
    };
  }, [queryClient]);

  const showHint = pull > 8 || busy;

  return (
    <div
      ref={scrollerRef}
      className={cn("overscroll-y-contain", className)}
      style={{ touchAction: "pan-y" }}
    >
      <div
        className="flex items-end justify-center overflow-hidden text-brand-text"
        style={{ height: busy ? THRESHOLD : pull }}
        aria-hidden={!showHint}
      >
        {showHint ? (
          <div className="flex flex-col items-center gap-1 pb-2">
            <div className="kb-boot-splash__spinner kb-ptr-spinner" />
            <span className="text-[11px] font-medium text-brand-text/80">
              {busy || pull >= THRESHOLD
                ? t("common.refreshing")
                : t("common.pullToRefresh")}
            </span>
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
