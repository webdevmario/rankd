"use client";

import { useCallback, useEffect, useState } from "react";
import { getListService } from "@/lib/lists";
import type { List, NewList } from "@/types/list";

type Status = "loading" | "ready" | "error";

export function useLists() {
  const [lists, setLists] = useState<List[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    getListService()
      .getLists()
      .then((result) => {
        setLists(result);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        console.error(error);
        setStatus("error");
      });
  }, []);

  const createList = useCallback(async (input: NewList) => {
    const list = await getListService().createList(input);
    setLists((prev) => [list, ...prev]);
    return list;
  }, []);

  return { lists, status, createList };
}
