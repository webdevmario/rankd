import { TIER_COLOR_FILL } from "@/lib/tier-colors";
import { cn } from "@/lib/utils";
import type { TierDef } from "@/types/list";

/** Label text size by length: a letter or two fills the cell, longer names step down and wrap. */
export function labelSize(label: string): "letter" | "short" | "long" {
  const length = [...label].length;
  if (length <= 2) return "letter";
  if (length <= 5) return "short";
  return "long";
}

/** Small tier chip, used on cards outside the board (linear view, tier summary). */
export function TierChip({ tier, className }: { tier: TierDef; className?: string }) {
  const letter = labelSize(tier.label) === "letter";
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center justify-center rounded-[5px] text-[11px] leading-none font-black text-black",
        letter ? "min-w-5 px-0.5" : "max-w-32 truncate px-1.5 font-bold",
        className,
      )}
      style={{ background: TIER_COLOR_FILL[tier.color] }}
      aria-label={`${tier.label} tier`}
      title={letter ? undefined : tier.label}
    >
      {tier.label}
    </span>
  );
}
