import { assignRanks, sortByRank } from "@/lib/ranking";
import { TIERS, type Item, type Tier } from "@/types/list";

/**
 * Pure tier-list primitives. A tier board is read top-to-bottom, left-to-right
 * (S … F, then the unranked pool), and every tier operation re-ranks items in
 * that reading order so the linear view always matches the board.
 */

export const UNRANKED = "unranked";

/** A droppable zone on the board: one of the tiers or the unranked pool. */
export type TierZone = Tier | typeof UNRANKED;

export const TIER_ZONES: readonly TierZone[] = [...TIERS, UNRANKED];

export type TierGroups = Record<TierZone, Item[]>;

export function isTierZone(value: unknown): value is TierZone {
  return typeof value === "string" && (TIER_ZONES as readonly string[]).includes(value);
}

export function zoneOf(item: Pick<Item, "tier">): TierZone {
  return item.tier ?? UNRANKED;
}

/** Items bucketed by zone, each bucket in rank order. */
export function groupByTier(items: readonly Item[]): TierGroups {
  const groups = Object.fromEntries(TIER_ZONES.map((zone) => [zone, [] as Item[]])) as TierGroups;
  for (const item of sortByRank(items)) groups[zoneOf(item)].push(item);
  return groups;
}

/** Flattens groups in board order, stamps each item's tier from its zone, and re-ranks. */
export function flattenTiers(groups: TierGroups): Item[] {
  return assignRanks(
    TIER_ZONES.flatMap((zone) =>
      groups[zone].map((item) => withTier(item, zone === UNRANKED ? undefined : zone)),
    ),
  );
}

/** Moves an item into `zone` at `index` (clamped), then re-ranks the whole board. */
export function moveToTier(items: readonly Item[], itemId: string, zone: TierZone, index: number): Item[] {
  const groups = groupByTier(items);
  const from = TIER_ZONES.find((z) => groups[z].some((item) => item.id === itemId));
  if (!from) return flattenTiers(groups);

  const item = groups[from].find((candidate) => candidate.id === itemId)!;
  groups[from] = groups[from].filter((candidate) => candidate.id !== itemId);
  const target = groups[zone];
  target.splice(Math.max(0, Math.min(index, target.length)), 0, item);
  return flattenTiers(groups);
}

export function tierCounts(items: readonly Item[]): Record<TierZone, number> {
  const counts = Object.fromEntries(TIER_ZONES.map((zone) => [zone, 0])) as Record<TierZone, number>;
  for (const item of items) counts[zoneOf(item)] += 1;
  return counts;
}

/** Maps a 1–10 rating onto a tier: 9–10 S, 8 A, 7 B, 6 C, 5 D, ≤4 F. */
export function tierFromRating(rating: number): Tier {
  if (rating >= 9) return "S";
  if (rating >= 8) return "A";
  if (rating >= 7) return "B";
  if (rating >= 6) return "C";
  if (rating >= 5) return "D";
  return "F";
}

/** Finds a rating written as "8/10" (or "8 / 10") in free text. */
export function ratingFromText(text: string | undefined): number | undefined {
  const match = text?.match(/\b(10|[0-9])\s*\/\s*10\b/);
  return match ? Number(match[1]) : undefined;
}

/**
 * First-time tiering for items that have never been on a board: an "X/10"
 * in the notes (preferred) or description places the item; anything else goes
 * to the unranked pool. Relative order within each zone is preserved.
 */
export function assignInitialTiers(items: readonly Item[]): Item[] {
  const placed = items.map((item) => {
    const rating = ratingFromText(item.notes) ?? ratingFromText(item.description);
    return withTier(item, rating === undefined ? undefined : tierFromRating(rating));
  });
  return flattenTiers(groupByTier(placed));
}

function withTier(item: Item, tier: Tier | undefined): Item {
  if (item.tier === tier) return item;
  const next = { ...item };
  if (tier) next.tier = tier;
  else delete next.tier;
  return next;
}
