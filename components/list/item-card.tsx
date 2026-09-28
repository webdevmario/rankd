"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { HTMLAttributes, Ref } from "react";
import { GripVertical, Pencil } from "lucide-react";
import { ItemCover } from "@/components/item-cover";
import { TierChip } from "@/components/tier/tier-styles";
import { useEntrance } from "@/components/entrance";
import { cn } from "@/lib/utils";
import type { Item, TierDef } from "@/types/list";

export interface DragHandleProps extends HTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
}

interface ItemCardProps {
  item: Item;
  /** The item's tier, shown as a chip. Absent when unranked. */
  tier?: TierDef;
  rank: number;
  handleProps?: DragHandleProps;
  /** The slot left behind while this item is being dragged. */
  placeholder?: boolean;
  /** Rendered inside the drag overlay, following the pointer. */
  overlay?: boolean;
  onEdit?: () => void;
}

const spring = { type: "spring", stiffness: 520, damping: 34 } as const;
const RESTING_SHADOW = "0px 0px 0px -16px rgba(0,0,0,0), 0px 0px 0px 0px rgba(255,122,26,0)";
const LIFTED_SHADOW = "0px 24px 48px -16px rgba(0,0,0,0.95), 0px 0px 0px 1px rgba(255,122,26,0.35)";

export function ItemCard({ item, tier, rank, handleProps, placeholder, overlay, onEdit }: ItemCardProps) {
  const entrance = useEntrance();

  return (
    <motion.div
      initial={overlay ? { boxShadow: RESTING_SHADOW } : entrance && { opacity: 0, y: 8 }}
      animate={overlay ? { boxShadow: LIFTED_SHADOW } : { opacity: 1, y: 0 }}
      transition={spring}
      className={cn(
        "item-card group relative flex items-start gap-2 rounded-xl border bg-card p-3 sm:gap-3",
        overlay
          ? "cursor-grabbing border-primary/40 bg-muted"
          : "border-border transition-colors duration-150 hover:border-border-strong hover:bg-muted",
        placeholder && "border-dashed border-primary/30 bg-transparent opacity-40",
      )}
    >
      <button
        type="button"
        aria-label={`Reorder ${item.title}`}
        {...handleProps}
        className={cn(
          "-ml-1 flex h-16 w-7 shrink-0 touch-none items-center justify-center rounded-md text-faint transition-colors",
          "hover:bg-white/5 hover:text-foreground focus-visible:text-foreground",
          overlay ? "cursor-grabbing text-primary" : "cursor-grab active:cursor-grabbing",
        )}
      >
        <GripVertical className="size-4" />
      </button>

      <RankNumber rank={rank} />

      <button
        type="button"
        onClick={onEdit}
        disabled={!onEdit}
        aria-label={`Edit ${item.title}`}
        className="flex min-w-0 flex-1 items-start gap-3 rounded-lg text-left"
      >
        <ItemCover
          key={item.coverImageUrl}
          title={item.title}
          src={item.coverImageUrl}
          className="h-16 w-11 rounded-md border border-border"
          initialsClassName="text-sm"
        />

        <div className="min-w-0 flex-1 pt-1">
          <div className="flex min-w-0 items-center gap-2">
            {tier && <TierChip tier={tier} />}
            <h3 className="truncate leading-snug font-semibold text-foreground" title={item.title}>
              {item.title}
            </h3>
          </div>
          {item.description && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{item.description}</p>
          )}
          {item.notes && (
            <p className="mt-1.5 line-clamp-2 text-sm whitespace-pre-line text-neutral-400">{item.notes}</p>
          )}
        </div>

        {onEdit && (
          <span
            aria-hidden
            className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-md text-faint transition-opacity group-hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Pencil className="size-3.5" />
          </span>
        )}
      </button>
    </motion.div>
  );
}

function RankNumber({ rank }: { rank: number }) {
  return (
    <div className="relative flex h-16 w-8 shrink-0 items-center justify-center overflow-hidden font-mono text-lg font-semibold text-primary tabular-nums sm:w-9">
      <span className="sr-only">Rank</span>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={rank}
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          transition={spring}
        >
          {rank}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
