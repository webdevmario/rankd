"use client";

import { List, Rows3, type LucideIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RANKING_MODES, type RankingMode } from "@/types/list";

const OPTIONS: Record<RankingMode, { label: string; icon: LucideIcon }> = {
  tier: { label: "Tier", icon: Rows3 },
  linear: { label: "Linear", icon: List },
};

/** Segmented Tier / Linear switch. */
export function ModeToggle({ mode, onChange }: { mode: RankingMode; onChange: (mode: RankingMode) => void }) {
  return (
    <ToggleGroup
      aria-label="Ranking view"
      value={[mode]}
      onValueChange={(value) => {
        const next = value[0] as RankingMode | undefined;
        if (next) onChange(next);
      }}
      spacing={0}
      className="rounded-lg border bg-card p-0.5"
    >
      {RANKING_MODES.map((option) => {
        const { label, icon: Icon } = OPTIONS[option];
        return (
          <ToggleGroupItem
            key={option}
            value={option}
            size="sm"
            className="rounded-md! px-2.5 text-muted-foreground aria-pressed:bg-foreground aria-pressed:text-background hover:aria-pressed:bg-foreground"
          >
            <Icon />
            {label}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
