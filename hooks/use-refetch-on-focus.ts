"use client";

import { useEffect } from "react";

/** Calls `refetch` when the tab becomes visible again, so edits made on another device show up. */
export function useRefetchOnFocus(refetch: () => void) {
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") refetch();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [refetch]);
}
