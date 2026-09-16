"use client";

import { Spinner } from "@heroui/react";
import { useEffect, useRef } from "react";

/** Reliable window-scroll infinite loader (IntersectionObserver). */
export function InfiniteLoadFooter({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasNextRef = useRef(hasNextPage);
  const fetchingRef = useRef(isFetchingNextPage);
  const fetchRef = useRef(fetchNextPage);

  hasNextRef.current = hasNextPage;
  fetchingRef.current = isFetchingNextPage;
  fetchRef.current = fetchNextPage;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        if (!hasNextRef.current || fetchingRef.current) return;
        void fetchRef.current();
      },
      { root: null, rootMargin: "320px 0px", threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage]);

  if (!hasNextPage && !isFetchingNextPage) return null;

  return (
    <div ref={sentinelRef} className="flex min-h-8 w-full items-center justify-center py-3">
      {isFetchingNextPage ? <Spinner size="sm" className="text-brand-gold" /> : null}
    </div>
  );
}
