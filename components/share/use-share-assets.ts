"use client";

import { useEffect, useRef, useState } from "react";
import { coverCollage, inlineCover } from "@/lib/share/covers";
import { sortByRank } from "@/lib/ranking";
import type { Item } from "@/types/list";

interface ShareAssets {
  /** Item id to cover data URL. */
  covers: Map<string, string>;
  collage?: string;
  ready: boolean;
}

/**
 * Inlines every cover as a data URL and builds the collage background. Covers
 * are cached by source URL, so a refetch of the list doesn't download them again.
 */
export function useShareAssets(items: Item[]): ShareAssets {
  const cache = useRef(new Map<string, Promise<string | undefined>>());
  const [assets, setAssets] = useState<ShareAssets>({ covers: new Map(), ready: false });
  const key = items.map((item) => `${item.id}:${item.coverImageUrl ?? ""}`).join("|");

  useEffect(() => {
    let cancelled = false;
    const ranked = sortByRank(items);

    const load = async () => {
      const entries = await Promise.all(
        ranked.map(async (item) => {
          const src = item.coverImageUrl;
          if (!src) return null;
          let pending = cache.current.get(src);
          if (!pending) {
            pending = inlineCover(src);
            cache.current.set(src, pending);
          }
          const dataUrl = await pending;
          return dataUrl ? ([item.id, dataUrl] as const) : null;
        }),
      );
      const covers = new Map(entries.filter((entry) => entry !== null));
      // Tiered covers first, so the collage leans on the best of the list.
      const collage = await coverCollage(
        [...ranked.filter((item) => item.tier), ...ranked.filter((item) => !item.tier)]
          .map((item) => covers.get(item.id))
          .filter((src): src is string => Boolean(src)),
      ).catch(() => undefined);
      if (!cancelled) setAssets({ covers, collage, ready: true });
    };

    void load();
    return () => {
      cancelled = true;
    };
    // `key` captures everything about `items` that matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return assets;
}
