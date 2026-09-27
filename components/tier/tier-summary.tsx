import { cn } from "@/lib/cn";
import { tierCounts, UNRANKED } from "@/lib/tiers";
import { TIERS, type Item } from "@/types/list";
import { TIER_TEXT } from "./tier-styles";

/** "10 items · 2 in S · 5 in A · Unranked: 0" — empty tiers are skipped. */
export function TierSummary({ items, className }: { items: Item[]; className?: string }) {
  const counts = tierCounts(items);

  return (
    <p
      className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-xs text-faint", className)}
    >
      <span>
        {items.length} {items.length === 1 ? "item" : "items"}
      </span>
      {TIERS.filter((tier) => counts[tier] > 0).map((tier) => (
        <span key={tier}>
          · {counts[tier]} in <span className={cn("font-bold", TIER_TEXT[tier])}>{tier}</span>
        </span>
      ))}
      <span className={cn(counts[UNRANKED] > 0 && "text-muted")}>· Unranked: {counts[UNRANKED]}</span>
    </p>
  );
}
