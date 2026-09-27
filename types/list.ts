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

/** How a list is ranked and displayed. Both views share the same underlying order. */
export const RANKING_MODES = ["tier", "linear"] as const;

export type RankingMode = (typeof RANKING_MODES)[number];

/** The classic rows every new list starts with, best to worst. Their ids are the letters themselves. */
export const DEFAULT_TIER_IDS = ["S", "A", "B", "C", "D", "F"] as const;

export type DefaultTierId = (typeof DEFAULT_TIER_IDS)[number];

/** Preset label colours for tier rows. The fills live in `lib/tier-colors.ts`. */
export const TIER_COLORS = [
  "sunset",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "teal",
  "blue",
  "indigo",
  "purple",
  "pink",
  "grey",
  "white",
] as const;

export type TierColor = (typeof TIER_COLORS)[number];

/** One row of a list's tier board. */
export interface TierDef {
  id: string;
  label: string;
  color: TierColor;
}

export const MAX_TIERS = 20;
export const MAX_TIER_LABEL = 20;

export interface Item {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  notes?: string;
  /**
   * 1-based position within the list. Ranks are always contiguous. In tier
   * mode this is reading order across the board: S → F, then unranked.
   */
  rank: number;
  /** Id of one of the list's tiers. Absent means unranked (the pool below the tiers). */
  tier?: string;
}

export interface List {
  id: string;
  title: string;
  description?: string;
  itemSourceType: ItemSourceType;
  rankingMode: RankingMode;
  /** The tier board's rows, top (best) to bottom. Always at least one. */
  tiers: TierDef[];
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp. */
  updatedAt: string;
  items: Item[];
}

/** Fields a caller supplies when adding an item; id and rank are assigned by the engine. */
export type NewItem = Omit<Item, "id" | "rank" | "tier">;

export type ItemPatch = Partial<NewItem>;

export interface NewList {
  title: string;
  description?: string;
  itemSourceType?: ItemSourceType;
  rankingMode?: RankingMode;
}

export type ListPatch = Partial<Pick<List, "title" | "description" | "rankingMode">>;
