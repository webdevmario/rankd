"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type HTMLAttributes, type Ref } from "react";
import { GripIcon, TrashIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { Item, ItemPatch } from "@/types/list";
import { TierChip } from "@/components/tier/tier-styles";
import { CoverThumb } from "./cover-thumb";
import { NotesEditor } from "./notes-editor";

export interface DragHandleProps extends HTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
}

interface ItemCardProps {
  item: Item;
  rank: number;
  handleProps?: DragHandleProps;
  /** The slot left behind while this item is being dragged. */
  placeholder?: boolean;
  /** Rendered inside the drag overlay, following the pointer. */
  overlay?: boolean;
  onUpdate?: (patch: ItemPatch) => void;
  onRemove?: () => void;
}

const spring = { type: "spring", stiffness: 520, damping: 34 } as const;
const RESTING_SHADOW = "0px 0px 0px -16px rgba(0,0,0,0), 0px 0px 0px 0px rgba(255,122,26,0)";
const LIFTED_SHADOW = "0px 24px 48px -16px rgba(0,0,0,0.95), 0px 0px 0px 1px rgba(255,122,26,0.35)";

export function ItemCard({
  item,
  rank,
  handleProps,
  placeholder,
  overlay,
  onUpdate,
  onRemove,
}: ItemCardProps) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [removing, setRemoving] = useState(false);

  return (
    <motion.div
      initial={overlay ? { boxShadow: RESTING_SHADOW } : { opacity: 0, y: 8 }}
      animate={
        removing
          ? { opacity: 0, x: -24 }
          : overlay
            ? { boxShadow: LIFTED_SHADOW }
            : { opacity: 1, y: 0, x: 0 }
      }
      transition={removing ? { duration: 0.18, ease: "easeIn" } : spring}
      onAnimationComplete={() => {
        if (removing) onRemove?.();
      }}
      className={cn(
        "item-card group relative flex items-start gap-2 rounded-xl border bg-surface p-3 pr-4 sm:gap-3",
        overlay
          ? "cursor-grabbing border-accent/40 bg-surface-raised"
          : "border-line transition-[translate,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-raised hover:shadow-[0_10px_30px_-18px_rgba(0,0,0,1)]",
        placeholder && "border-dashed border-accent/30 bg-transparent opacity-40",
      )}
    >
      <button
        type="button"
        aria-label={`Reorder ${item.title}`}
        {...handleProps}
        className={cn(
          "-ml-1 flex h-10 w-7 shrink-0 touch-none items-center justify-center rounded-md text-faint transition-colors",
          "hover:bg-white/5 hover:text-white focus-visible:text-white",
          overlay ? "cursor-grabbing text-accent" : "cursor-grab active:cursor-grabbing",
        )}
      >
        <GripIcon />
      </button>

      <RankNumber rank={rank} />

      {item.coverImageUrl && <CoverThumb key={item.coverImageUrl} src={item.coverImageUrl} />}

      <div className="min-w-0 flex-1 pt-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              {item.tier && <TierChip tier={item.tier} />}
              <h3 className="truncate leading-snug font-semibold text-white">{item.title}</h3>
            </div>
            {item.description && <p className="mt-0.5 truncate text-sm text-muted">{item.description}</p>}
          </div>

          {onRemove && (
            <button
              type="button"
              onClick={() => (confirmingRemove ? setRemoving(true) : setConfirmingRemove(true))}
              onBlur={() => setConfirmingRemove(false)}
              onMouseLeave={() => setConfirmingRemove(false)}
              aria-label={confirmingRemove ? `Confirm removing ${item.title}` : `Remove ${item.title}`}
              className={cn(
                "-mt-0.5 flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs transition-all",
                confirmingRemove
                  ? "bg-danger/15 text-danger opacity-100"
                  : "text-faint opacity-100 hover:bg-white/5 hover:text-white focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
              )}
            >
              <TrashIcon width={14} height={14} />
              {confirmingRemove && "Remove?"}
            </button>
          )}
        </div>

        <NotesEditor
          itemTitle={item.title}
          notes={item.notes}
          onSave={onUpdate && ((notes) => onUpdate({ notes }))}
        />
      </div>
    </motion.div>
  );
}

function RankNumber({ rank }: { rank: number }) {
  return (
    <div className="relative flex h-10 w-8 shrink-0 items-center justify-center overflow-hidden font-mono text-lg font-semibold text-accent tabular-nums sm:w-9">
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
