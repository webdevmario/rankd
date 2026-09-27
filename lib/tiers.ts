import { createId } from "@/lib/id";
import { assignRanks, sortByRank } from "@/lib/ranking";
import {
  DEFAULT_TIER_IDS,
  TIER_COLORS,
  type DefaultTierId,
  type Item,
  type TierColor,
  type TierDef,
} from "@/types/list";

/**
 * Pure tier-list primitives. A tier board is read top-to-bottom, left-to-right
 * (the list's tiers in order, then the unranked pool), and every tier
 * operation re-ranks items in that reading order so the linear view always
 * matches the board.
 */

export const UNRANKED = "unranked";

/** A droppable zone on the board: one of the list's tier ids, or the unranked pool. */
export type TierZone = string;

export type TierGroups = Record<TierZone, Item[]>;

const DEFAULT_COLORS: Record<DefaultTierId, TierColor> = {
  S: "sunset",
  A: "orange",
  B: "yellow",
  C: "green",
  D: "blue",
  F: "grey",
};

/** The classic S to F rows. */
export function defaultTiers(): TierDef[] {
  return DEFAULT_TIER_IDS.map((id) => ({ id, label: id, color: DEFAULT_COLORS[id] }));
}

/** Every zone on the board, in reading order. */
export function tierZones(tiers: readonly TierDef[]): TierZone[] {
  return [...tiers.map((tier) => tier.id), UNRANKED];
}

/** The zone an item sits in. Items pointing at a tier the list no longer has count as unranked. */
export function zoneOf(item: Pick<Item, "tier">, tiers: readonly TierDef[]): TierZone {
  return item.tier && tiers.some((tier) => tier.id === item.tier) ? item.tier : UNRANKED;
}

/** Items bucketed by zone, each bucket in rank order. */
export function groupByTier(items: readonly Item[], tiers: readonly TierDef[]): TierGroups {
  const groups: TierGroups = Object.fromEntries(tierZones(tiers).map((zone) => [zone, [] as Item[]]));
  for (const item of sortByRank(items)) groups[zoneOf(item, tiers)].push(item);
  return groups;
}

/** Flattens groups in board order, stamps each item's tier from its zone, and re-ranks. */
export function flattenTiers(groups: TierGroups, tiers: readonly TierDef[]): Item[] {
  return assignRanks(
    tierZones(tiers).flatMap((zone) =>
      (groups[zone] ?? []).map((item) => withTier(item, zone === UNRANKED ? undefined : zone)),
    ),
  );
}

/** Moves an item into `zone` at `index` (clamped), then re-ranks the whole board. */
export function moveToTier(
  items: readonly Item[],
  tiers: readonly TierDef[],
  itemId: string,
  zone: TierZone,
  index: number,
): Item[] {
  const groups = groupByTier(items, tiers);
  const from = tierZones(tiers).find((z) => groups[z].some((item) => item.id === itemId));
  if (!from || !(zone in groups)) return flattenTiers(groups, tiers);

  const item = groups[from].find((candidate) => candidate.id === itemId)!;
  groups[from] = groups[from].filter((candidate) => candidate.id !== itemId);
  const target = groups[zone];
  target.splice(Math.max(0, Math.min(index, target.length)), 0, item);
  return flattenTiers(groups, tiers);
}

/**
 * Re-seats items after the tier rows change (reordered, added, removed).
 * Items from a removed tier fall to the top of the unranked pool, since they
 * were ranked above everything already there.
 */
export function applyTiers(items: readonly Item[], tiers: readonly TierDef[]): Item[] {
  return flattenTiers(groupByTier(items, tiers), tiers);
}

export function tierCounts(items: readonly Item[], tiers: readonly TierDef[]): Record<TierZone, number> {
  const counts: Record<TierZone, number> = Object.fromEntries(tierZones(tiers).map((zone) => [zone, 0]));
  for (const item of items) counts[zoneOf(item, tiers)] += 1;
  return counts;
}

/**
 * A new row to insert at `index`. Its label continues a run of single
 * letters (after "F" comes "G") when that letter is free, and its colour is
 * the first preset the board isn't using yet.
 */
export function newTier(tiers: readonly TierDef[], index: number): TierDef {
  const above = tiers[index - 1]?.label ?? "";
  const next = /^[A-Ya-y]$/.test(above) ? String.fromCharCode(above.charCodeAt(0) + 1) : "";
  const taken = new Set(tiers.map((tier) => tier.label.toLowerCase()));
  const label = next && !taken.has(next.toLowerCase()) ? next : "New";
  const used = new Set(tiers.map((tier) => tier.color));
  const color = TIER_COLORS.find((candidate) => !used.has(candidate)) ?? "grey";
  return { id: createId(), label, color };
}

/** Maps a 1–10 rating onto a classic tier: 9–10 S, 8 A, 7 B, 6 C, 5 D, ≤4 F. */
export function tierFromRating(rating: number): DefaultTierId {
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
 * in the notes (preferred) or description places the item on the classic
 * rows; anything else goes to the unranked pool. Relative order within each
 * zone is preserved.
 */
export function assignInitialTiers(items: readonly Item[]): Item[] {
  const tiers = defaultTiers();
  const placed = items.map((item) => {
    const rating = ratingFromText(item.notes) ?? ratingFromText(item.description);
    return withTier(item, rating === undefined ? undefined : tierFromRating(rating));
  });
  return applyTiers(placed, tiers);
}

function withTier(item: Item, tier: string | undefined): Item {
  if (item.tier === tier) return item;
  const next = { ...item };
  if (tier) next.tier = tier;
  else delete next.tier;
  return next;
}
