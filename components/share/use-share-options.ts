"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SHARE_OPTIONS, parseShareOptions, type ShareOptions } from "@/lib/share/options";

const STORAGE_KEY = "rankd:share-options";

/** Composer settings, remembered per browser so the next export starts where the last one ended. */
export function useShareOptions() {
  const [options, setOptions] = useState<ShareOptions>(DEFAULT_SHARE_OPTIONS);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      // Read after hydration: localStorage doesn't exist during the server render.
      if (saved) setOptions(parseShareOptions(JSON.parse(saved)));
    } catch {
      // Storage unavailable or corrupt: keep the defaults.
    }
  }, []);

  const update = useCallback((patch: Partial<ShareOptions>) => {
    setOptions((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Not remembering is fine.
      }
      return next;
    });
  }, []);

  return [options, update] as const;
}
