import { cn } from "@/lib/utils";
import type { Tier } from "@/types/list";

/** Solid badge fill per tier; text on top is always black. */
export const TIER_FILL: Record<Tier, string> = {
  S: "bg-linear-to-br from-tier-s to-tier-s-gold",
  A: "bg-tier-a",
  B: "bg-tier-b",
  C: "bg-tier-c",
  D: "bg-tier-d",
  F: "bg-tier-f",
};

/** Text colour per tier, for counts and inline mentions. */
export const TIER_TEXT: Record<Tier, string> = {
  S: "text-tier-s",
  A: "text-tier-a",
  B: "text-tier-b",
  C: "text-tier-c",
  D: "text-tier-d",
  F: "text-tier-f",
};

/** Small tier letter chip, used on cards outside the board (linear view, index). */
export function TierChip({ tier, className }: { tier: Tier; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] text-[11px] leading-none font-black text-black",
        TIER_FILL[tier],
        className,
      )}
      aria-label={`${tier} tier`}
    >
      {tier}
    </span>
  );
}
