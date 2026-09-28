"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getListService } from "@/lib/lists";
import { appendItem, moveItem, patchItem, removeItem } from "@/lib/ranking";
import { cleanItemPatch, saveErrorMessage } from "@/lib/text";
import { applyTiers, moveToTier as placeInTier, type TierZone } from "@/lib/tiers";
import type { ItemPatch, List, ListPatch, NewItem, RankingMode, TierDef } from "@/types/list";
import { useRefetchOnFocus } from "./use-refetch-on-focus";

type Status = "loading" | "ready" | "not-found" | "error";

interface State {
  status: Status;
  list: List | null;
}

/**
 * Loads one list and exposes its mutations. Item edits are applied to local
 * state immediately (so drag-and-drop never flickers) and then persisted; if
 * persistence fails the list is reloaded from storage.
 *
 * `initial` is the list as the server rendered it (null: not found). The page
 * shows it at once and refreshes it quietly in the background.
 */
export function useList(id: string, initial?: List | null) {
  const [state, setState] = useState<State>(() =>
    initial === undefined
      ? { status: "loading", list: null }
      : initial
        ? { status: "ready", list: initial }
        : { status: "not-found", list: null },
  );
  // Bumped by every local edit, so a reload that started before the edit doesn't undo it on screen.
  const edits = useRef(0);

  const load = useCallback(async () => {
    const editsAtStart = edits.current;
    try {
      const list = await getListService().getList(id);
      if (edits.current !== editsAtStart) return;
      setState(list ? { status: "ready", list } : { status: "not-found", list: null });
    } catch (error) {
      console.error(error);
      setState((prev) => (prev.list ? prev : { status: "error", list: null }));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useRefetchOnFocus(load);

  const optimistic = useCallback(
    (apply: (list: List) => List, persist: () => Promise<unknown>) => {
      edits.current++;
      setState((prev) => (prev.list ? { ...prev, list: apply(prev.list) } : prev));
      persist().catch((error: unknown) => {
        console.error(error);
        toast.error(saveErrorMessage(error, "Couldn't save that change. The list was reloaded."));
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
        (list) => ({ ...list, items: placeInTier(list.items, list.tiers, itemId, zone, index) }),
        () => getListService().moveItemToTier(id, itemId, zone, index),
      ),
    [id, optimistic],
  );

  const setTiers = useCallback(
    (tiers: TierDef[]) =>
      optimistic(
        (list) => ({ ...list, tiers, items: applyTiers(list.items, tiers) }),
        () => getListService().setTiers(id, tiers),
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

  /** Like `updateItem`, but waits for the save so a form can report failures (e.g. storage full). */
  const saveItem = useCallback(
    async (itemId: string, patch: ItemPatch) => {
      const list = await getListService().updateItem(id, itemId, patch);
      edits.current++;
      setState({ status: "ready", list });
      return list;
    },
    [id],
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
      edits.current++;
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
      edits.current++;
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
    setTiers,
    setRankingMode,
    addItem,
    updateItem,
    saveItem,
    deleteItem,
    updateDetails,
    deleteList,
  };
}
