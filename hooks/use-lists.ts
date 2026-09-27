"use client";

import { useCallback, useEffect, useState } from "react";
import { getListService } from "@/lib/lists";
import type { List, NewList } from "@/types/list";
import { useRefetchOnFocus } from "./use-refetch-on-focus";

type Status = "loading" | "ready" | "error";

export function useLists() {
  const [lists, setLists] = useState<List[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  const load = useCallback(async () => {
    try {
      setLists(await getListService().getLists());
      setStatus("ready");
    } catch (error) {
      console.error(error);
      setStatus("error");
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
