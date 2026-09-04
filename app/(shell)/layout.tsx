"use client";

import { BottomNav } from "@/components/bottom-nav";
import { PullToRefresh } from "@/components/pull-to-refresh";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="kb-app-bg flex justify-center overflow-hidden">
      <div className="flex h-full w-full max-w-[990px] flex-col px-[18px]">
        <PullToRefresh className="safe-top min-h-0 flex-1 overflow-y-auto pt-5 pb-3">
          <div className="flex min-h-full flex-col gap-3">{children}</div>
        </PullToRefresh>
        <div className="kb-bottom-nav-wrap shrink-0">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
