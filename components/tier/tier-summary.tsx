import { cn } from "@/lib/utils";
import { tierCounts, UNRANKED } from "@/lib/tiers";
import type { Item, TierDef } from "@/types/list";
import { TierChip } from "./tier-styles";

/** One chip and count per tier, in board order, then the unranked count. Empty tiers are dimmed. */
export function TierSummary({
  items,
  tiers,
  className,
}: {
  items: Item[];
  tiers: TierDef[];
  className?: string;
}) {
  const counts = tierCounts(items, tiers);

  return (
    <dl
      aria-label="Items per tier"
      className={cn("flex flex-wrap items-center gap-x-3.5 gap-y-2 text-sm tabular-nums", className)}
    >
      {tiers.map((tier) => (
        <div key={tier.id} className={cn("flex items-center gap-1.5", counts[tier.id] === 0 && "opacity-35")}>
          <dt>
            <TierChip tier={tier} />
          </dt>
          <dd className="font-semibold text-foreground">{counts[tier.id]}</dd>
        </div>
      ))}
      <div className="flex items-center gap-1.5 border-l border-border pl-3.5">
        <dt className="text-muted-foreground">Unranked</dt>
        <dd className="font-semibold text-foreground">{counts[UNRANKED]}</dd>
      </div>
    </dl>
  );
}
