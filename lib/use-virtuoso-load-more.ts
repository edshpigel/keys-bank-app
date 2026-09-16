"use client";

import { useCallback } from "react";

/** Stable `endReached` handler for Virtuoso + useInfiniteQuery. */
export function useVirtuosoLoadMore(
  hasNextPage: boolean | undefined,
  isFetchingNextPage: boolean,
  fetchNextPage: () => unknown,
) {
  return useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
}
