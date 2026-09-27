/**
 * Core data model for the ranking engine.
 *
 * A List is an ordered collection of Items. Where the items come from is
 * described by `itemSourceType`; the matching adapter lives in `lib/sources/`.
 */

/**
 * Every source the engine knows about. Only `"manual"` has an adapter today;
 * the others are reserved so stored data and UI can already reference them.
 */
export const ITEM_SOURCE_TYPES = ["manual", "stack-api", "csv-import"] as const;

export type ItemSourceType = (typeof ITEM_SOURCE_TYPES)[number];

export interface Item {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  notes?: string;
  /** 1-based position within the list. Ranks are always contiguous. */
  rank: number;
}

export interface List {
  id: string;
  title: string;
  description?: string;
  itemSourceType: ItemSourceType;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp. */
  updatedAt: string;
  items: Item[];
}

/** Fields a caller supplies when adding an item; id and rank are assigned by the engine. */
export type NewItem = Omit<Item, "id" | "rank">;

export type ItemPatch = Partial<NewItem>;

export interface NewList {
  title: string;
  description?: string;
  itemSourceType?: ItemSourceType;
}

export type ListPatch = Partial<Pick<List, "title" | "description">>;
