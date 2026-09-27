"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ListIcon, TiersIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { RankingMode } from "@/types/list";

const OPTIONS: Array<{ mode: RankingMode; label: string; icon: ReactNode }> = [
  { mode: "tier", label: "Tier", icon: <TiersIcon width={14} height={14} /> },
  { mode: "linear", label: "Linear", icon: <ListIcon width={14} height={14} /> },
];

/** Segmented Tier / Linear switch. */
export function ModeToggle({ mode, onChange }: { mode: RankingMode; onChange: (mode: RankingMode) => void }) {
  return (
    <div
      role="group"
      aria-label="Ranking view"
      className="flex rounded-lg border border-line bg-surface p-0.5"
    >
      {OPTIONS.map((option) => {
        const active = option.mode === mode;
        return (
          <button
            key={option.mode}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.mode)}
            className={cn(
              "relative flex h-7 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors",
              active ? "text-black" : "text-muted hover:text-white",
            )}
          >
            {active && (
              <motion.span
                layoutId="mode-toggle-pill"
                className="absolute inset-0 rounded-md bg-white"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
