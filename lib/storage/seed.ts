import kingBooks from "@/data/king-books.json";
import { createId, now } from "@/lib/id";
import { flattenTiers, groupByTier, tierFromRating } from "@/lib/tiers";
import type { Item, List } from "@/types/list";

/**
 * Bump when the seed content changes so browsers that already have data get a
 * one-time `backfillSeed` pass.
 *
 * 1 — empty "Stephen King — Recently Read" list
 * 2 — that list pre-filled from Stacks (data/king-books.json)
 */
export const SEED_VERSION = 2;

const KING_TITLE = "Stephen King — Recently Read";

/** The Stacks import, pre-placed on the tier board by each book's Stacks rating. */
function kingItems(): Item[] {
  const items = kingBooks.items.map(({ title, description, coverImageUrl, stacks }, index) => ({
    id: createId(),
    rank: index + 1,
    title,
    description,
    ...(coverImageUrl ? { coverImageUrl } : {}),
    tier: tierFromRating(stacks.rating),
  }));
  return flattenTiers(groupByTier(items));
}

/** Lists created on first run. */
export function seedLists(): List[] {
  const timestamp = now();
  return [
    {
      id: createId(),
      title: KING_TITLE,
      description: "Ranking my most recent reads, worst to best (well, favorite last).",
      itemSourceType: "manual",
      rankingMode: "tier",
      createdAt: timestamp,
      updatedAt: timestamp,
      items: kingItems(),
    },
  ];
}

/**
 * Upgrades data written by an older seed. Fills the seeded King list only if
 * it still exists and is still empty, so deleted lists and user-added items
 * are never touched.
 */
export function backfillSeed(lists: List[]): List[] {
  return lists.map((list) =>
    list.title === KING_TITLE && list.items.length === 0
      ? { ...list, items: kingItems(), updatedAt: now() }
      : list,
  );
}
