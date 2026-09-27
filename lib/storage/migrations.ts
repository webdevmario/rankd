import { assignInitialTiers } from "@/lib/tiers";
import type { List } from "@/types/list";

/** A list as it may exist in storage written by an older version of the app. */
export type StoredList = Omit<List, "rankingMode"> & Partial<Pick<List, "rankingMode">>;

/**
 * Brings a stored list up to the current schema. Returns the same object when
 * nothing changed so callers can tell whether to persist.
 *
 * - Lists from before ranking modes existed become tier lists, and their items
 *   are placed on the board from any "X/10" rating in their notes/description
 *   (unrated items land in the unranked pool).
 */
export function migrateList(list: StoredList): List {
  if (list.rankingMode) return list as List;
  return { ...list, rankingMode: "tier", items: assignInitialTiers(list.items) };
}
