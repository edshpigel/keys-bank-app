"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { ShellStickyTargetProvider } from "@/lib/shell-sticky";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <ShellStickyTargetProvider>
      {(setTarget) => <ShellLayoutInner setTarget={setTarget}>{children}</ShellLayoutInner>}
    </ShellStickyTargetProvider>
  );
}

function ShellLayoutInner({
  children,
  setTarget,
}: {
  children: ReactNode;
  setTarget: (el: HTMLElement | null) => void;
}) {
  const slotRef = useRef<HTMLDivElement | null>(null);
  const [hasSticky, setHasSticky] = useState(false);

  useEffect(() => {
    const el = slotRef.current;
    setTarget(el);
    if (!el) return;
    const sync = () => setHasSticky(el.childElementCount > 0);
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(el, { childList: true });
    return () => {
      obs.disconnect();
      setTarget(null);
    };
  }, [setTarget]);

  return (
    <div className="kb-app-bg flex justify-center overflow-hidden">
      <div className="flex h-full w-full max-w-[990px] flex-col px-5">
        <PullToRefresh className="safe-top min-h-0 flex-1 overflow-y-auto pt-3 pb-3">
          <div className="flex min-h-full flex-col gap-3">{children}</div>
        </PullToRefresh>

        <div
          ref={slotRef}
          className={hasSticky ? "shrink-0 pb-2 pt-1" : "h-0 shrink-0 overflow-hidden"}
        />

        <div className="kb-bottom-nav-wrap shrink-0">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
