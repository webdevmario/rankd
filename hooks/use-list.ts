"use client";

import { useCallback, useEffect, useState } from "react";
import { getListService } from "@/lib/lists";
import { appendItem, moveItem, patchItem, removeItem } from "@/lib/ranking";
import { cleanItemPatch } from "@/lib/text";
import { moveToTier as placeInTier, type TierZone } from "@/lib/tiers";
import type { ItemPatch, List, ListPatch, NewItem, RankingMode } from "@/types/list";

type Status = "loading" | "ready" | "not-found" | "error";

interface State {
  status: Status;
  list: List | null;
}

/**
 * Loads one list and exposes its mutations. Item edits are applied to local
 * state immediately (so drag-and-drop never flickers) and then persisted; if
 * persistence fails the list is reloaded from storage.
 */
export function useList(id: string) {
  const [state, setState] = useState<State>({ status: "loading", list: null });

  const load = useCallback(async () => {
    try {
      const list = await getListService().getList(id);
      setState(list ? { status: "ready", list } : { status: "not-found", list: null });
    } catch (error) {
      console.error(error);
      setState({ status: "error", list: null });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const optimistic = useCallback(
    (apply: (list: List) => List, persist: () => Promise<unknown>) => {
      setState((prev) => (prev.list ? { ...prev, list: apply(prev.list) } : prev));
      persist().catch((error: unknown) => {
        console.error(error);
        void load();
      });
    },
    [load],
  );

  const reorder = useCallback(
    (activeId: string, overId: string) =>
      optimistic(
        (list) => ({ ...list, items: moveItem(list.items, activeId, overId) }),
        () => getListService().reorderItems(id, activeId, overId),
      ),
    [id, optimistic],
  );

  const moveToTier = useCallback(
    (itemId: string, zone: TierZone, index: number) =>
      optimistic(
        (list) => ({ ...list, items: placeInTier(list.items, itemId, zone, index) }),
        () => getListService().moveItemToTier(id, itemId, zone, index),
      ),
    [id, optimistic],
  );

  const setRankingMode = useCallback(
    (rankingMode: RankingMode) =>
      optimistic(
        (list) => ({ ...list, rankingMode }),
        () => getListService().updateList(id, { rankingMode }),
      ),
    [id, optimistic],
  );

  const updateItem = useCallback(
    (itemId: string, patch: ItemPatch) =>
      optimistic(
        (list) => ({ ...list, items: patchItem(list.items, itemId, cleanItemPatch(patch)) }),
        () => getListService().updateItem(id, itemId, patch),
      ),
    [id, optimistic],
  );

  const deleteItem = useCallback(
    (itemId: string) =>
      optimistic(
        (list) => ({ ...list, items: removeItem(list.items, itemId) }),
        () => getListService().removeItem(id, itemId),
      ),
    [id, optimistic],
  );

  const addItem = useCallback(
    async (input: NewItem) => {
      const item = await getListService().addItem(id, input);
      setState((prev) =>
        prev.list ? { ...prev, list: { ...prev.list, items: appendItem(prev.list.items, item) } } : prev,
      );
      return item;
    },
    [id],
  );

  const updateDetails = useCallback(
    async (patch: ListPatch) => {
      const list = await getListService().updateList(id, patch);
      setState({ status: "ready", list });
      return list;
    },
    [id],
  );

  const deleteList = useCallback(() => getListService().deleteList(id), [id]);

  return {
    ...state,
    reorder,
    moveToTier,
    setRankingMode,
    addItem,
    updateItem,
    deleteItem,
    updateDetails,
    deleteList,
  };
}
