"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { tierCounts, UNRANKED } from "@/lib/tiers";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Item, TierDef } from "@/types/list";
import { TierChip } from "./tier-styles";

/**
 * A one-line item count that opens the per-tier breakdown: one chip and count
 * per tier, in board order, then the unranked count. Empty tiers are dimmed.
 */
export function TierSummary({ items, tiers }: { items: Item[]; tiers: TierDef[] }) {
  const counts = tierCounts(items, tiers);
  const unranked = counts[UNRANKED];

  return (
    <Popover>
      <PopoverTrigger className="-mx-2 inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground tabular-nums transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[popup-open]:bg-accent data-[popup-open]:text-foreground">
        {items.length} {items.length === 1 ? "item" : "items"}
        {unranked > 0 && <span className="text-faint">· {unranked} unranked</span>}
        <ChevronDown className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48">
        <dl aria-label="Items per tier" className="flex flex-col gap-1.5 text-sm tabular-nums">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={cn("flex items-center justify-between gap-3", counts[tier.id] === 0 && "opacity-35")}
            >
              <dt className="min-w-0">
                <TierChip tier={tier} />
              </dt>
              <dd className="font-semibold text-foreground">{counts[tier.id]}</dd>
            </div>
          ))}
          <div className="mt-1 flex items-center justify-between gap-3 border-t border-border pt-2">
            <dt className="text-muted-foreground">Unranked</dt>
            <dd className="font-semibold text-foreground">{unranked}</dd>
          </div>
        </dl>
      </PopoverContent>
    </Popover>
  );
}
