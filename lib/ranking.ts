import type { Item, ItemPatch } from "@/types/list";

/**
 * Pure ranking primitives. Every function returns a new array whose ranks are
 * contiguous and 1-based, so callers can apply them optimistically in the UI
 * and again in the persistence layer and get the same result.
 */

export function sortByRank(items: readonly Item[]): Item[] {
  return [...items].sort((a, b) => a.rank - b.rank);
}

/** Assigns ranks from array order (index 0 → rank 1). */
export function assignRanks(ordered: readonly Item[]): Item[] {
  return ordered.map((item, index) => (item.rank === index + 1 ? item : { ...item, rank: index + 1 }));
}

/** Repairs gaps or duplicates by re-ranking in current rank order. */
export function normalizeRanks(items: readonly Item[]): Item[] {
  return assignRanks(sortByRank(items));
}

/** Moves `activeId` into the slot currently held by `overId`. */
export function moveItem(items: readonly Item[], activeId: string, overId: string): Item[] {
  const ordered = sortByRank(items);
  const from = ordered.findIndex((item) => item.id === activeId);
  const to = ordered.findIndex((item) => item.id === overId);
  if (from === -1 || to === -1 || from === to) return assignRanks(ordered);

  const [moved] = ordered.splice(from, 1);
  ordered.splice(to, 0, moved);
  return assignRanks(ordered);
}

export function appendItem(items: readonly Item[], item: Item): Item[] {
  return assignRanks([...sortByRank(items), item]);
}

export function removeItem(items: readonly Item[], itemId: string): Item[] {
  return assignRanks(sortByRank(items).filter((item) => item.id !== itemId));
}

export function patchItem(items: readonly Item[], itemId: string, patch: ItemPatch): Item[] {
  return items.map((item) => (item.id === itemId ? { ...item, ...patch } : item));
}
