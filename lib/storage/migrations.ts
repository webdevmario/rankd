import { assignInitialTiers } from "@/lib/tiers";
import type { Item, List } from "@/types/list";

/** A list as it may exist in storage written by an older version of the app. */
export type StoredList = Omit<List, "rankingMode"> & Partial<Pick<List, "rankingMode">>;

/** The seeded King list's original title, written with an em dash (U+2014). */
const OLD_KING_TITLE = `Stephen King ${String.fromCharCode(0x2014)} Recently Read`;
export const KING_TITLE = "Stephen King: Recently Read";

/** Seeded descriptions used to end in the Stacks rating, e.g. "Read Aug 2023 · 6/10 in Stacks". */
const STACKS_SUFFIX = /\s*·\s*\d+\/10 in Stacks$/;

/**
 * Brings a stored list up to the current schema. Returns the same object when
 * nothing changed so callers can tell whether to persist.
 *
 * - Lists from before ranking modes existed become tier lists, and their items
 *   are placed on the board from any "X/10" rating in their notes/description
 *   (unrated items land in the unranked pool).
 * - The seeded King list loses the em dash in its title and the Stacks rating
 *   at the end of each description (the tier already says it).
 */
export function migrateList(stored: StoredList): List {
  let list = stored.rankingMode
    ? (stored as List)
    : { ...stored, rankingMode: "tier" as const, items: assignInitialTiers(stored.items) };

  if (list.title === OLD_KING_TITLE) list = { ...list, title: KING_TITLE };

  if (list.items.some((item) => item.description && STACKS_SUFFIX.test(item.description))) {
    list = { ...list, items: list.items.map(dropStacksSuffix) };
  }
  return list;
}

function dropStacksSuffix(item: Item): Item {
  if (!item.description || !STACKS_SUFFIX.test(item.description)) return item;
  const description = item.description.replace(STACKS_SUFFIX, "").trim();
  const next: Item = { ...item, description };
  if (!description) delete next.description;
  return next;
}
