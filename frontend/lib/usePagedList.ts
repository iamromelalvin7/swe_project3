"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authFetch } from "./api";
import type { PageResponse } from "./types";

/** The API's maximum page size — admin lists load in pages of this. */
export const ADMIN_PAGE_SIZE = 50;

/**
 * Loads an admin list page by page. `path` is the endpoint plus its filter
 * query (no page params); changing it starts over from page 0. Responses for
 * a superseded path are ignored, so a fast filter change can't show stale rows.
 */
export function usePagedList<T>(path: string | null, enabled: boolean) {
  const [items, setItems] = useState<T[] | null>(null);
  const [page, setPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const current = useRef(path);

  const fetchPage = useCallback(
    (p: number) => {
      const sep = path!.includes("?") ? "&" : "?";
      return authFetch<PageResponse<T>>(`${path}${sep}page=${p}&pageSize=${ADMIN_PAGE_SIZE}`);
    },
    [path]
  );

  const reload = useCallback(() => {
    if (!path || !enabled) return;
    current.current = path;
    setItems(null);
    setError(false);
    setMoreError(false);
    fetchPage(0)
      .then((res) => {
        if (current.current !== path) return;
        setItems(res.items);
        setPage(res.page);
        setTotalItems(res.totalItems);
        setTotalPages(res.totalPages);
      })
      .catch(() => current.current === path && setError(true));
  }, [path, enabled, fetchPage]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function loadMore() {
    if (!path || !enabled) return;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const res = await fetchPage(page + 1);
      if (current.current !== path) return;
      setItems((prev) => [...(prev ?? []), ...res.items]);
      setPage(res.page);
      setTotalPages(res.totalPages);
      setTotalItems(res.totalItems);
    } catch {
      setMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  return { items, totalItems, hasMore: page + 1 < totalPages, loadMore, loadingMore, moreError, error, reload };
}

/** `totalItems` for each query, fetched with pageSize=1 — used for filter counts. */
export function useCounts(paths: Record<string, string> | null, enabled: boolean) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const key = paths ? JSON.stringify(paths) : null;

  useEffect(() => {
    if (!paths || !enabled) return;
    let cancelled = false;
    Promise.all(
      Object.entries(paths).map(([name, path]) => {
        const sep = path.includes("?") ? "&" : "?";
        return authFetch<PageResponse<unknown>>(`${path}${sep}pageSize=1`)
          .then((res) => [name, res.totalItems] as const)
          .catch(() => null);
      })
    ).then((results) => {
      if (cancelled) return;
      setCounts(Object.fromEntries(results.filter((r): r is readonly [string, number] => r !== null)));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return counts;
}
