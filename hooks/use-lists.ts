"use client";

import { useCallback, useEffect, useState } from "react";
import { getListService } from "@/lib/lists";
import type { List, NewList } from "@/types/list";
import { useRefetchOnFocus } from "./use-refetch-on-focus";

type Status = "loading" | "ready" | "error";

/** All lists. `initial` is what the server rendered: shown at once, then refreshed quietly. */
export function useLists(initial?: List[]) {
  const [lists, setLists] = useState<List[]>(initial ?? []);
  const [status, setStatus] = useState<Status>(initial ? "ready" : "loading");

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
