"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getListService } from "@/lib/lists";
import type { List, NewList } from "@/types/list";
import { useRefetchOnFocus } from "./use-refetch-on-focus";

type Status = "loading" | "ready" | "error";

/**
 * All lists. `initial` is what the server rendered: shown as is, with no second
 * fetch on mount, and refreshed when the tab comes back into view.
 */
export function useLists(initial?: List[]) {
  const [lists, setLists] = useState<List[]>(initial ?? []);
  const [status, setStatus] = useState<Status>(initial ? "ready" : "loading");
  const rendered = useRef(initial !== undefined);

  const load = useCallback(async () => {
    try {
      setLists(await getListService().getLists());
      setStatus("ready");
    } catch (error) {
      console.error(error);
      setStatus((prev) => (prev === "ready" ? prev : "error"));
    }
  }, []);

  useEffect(() => {
    // The server just read these; reading them again would only repeat the database and Stacks calls.
    if (rendered.current) return;
    void load();
  }, [load]);

  useRefetchOnFocus(load);

  const createList = useCallback(async (input: NewList) => {
    const list = await getListService().createList(input);
    setLists((prev) => [list, ...prev]);
    return list;
  }, []);

  return { lists, status, createList, reload: load };
}
