"use client";

import { motion } from "framer-motion";
import type { SyntheticEvent } from "react";
import { Pencil } from "lucide-react";
import { ItemCover } from "@/components/item-cover";
import { cn } from "@/lib/utils";
import type { Item } from "@/types/list";

const spring = { type: "spring", stiffness: 520, damping: 34 } as const;
const RESTING_SHADOW = "0px 0px 0px -12px rgba(0,0,0,0), 0px 0px 0px 0px rgba(255,255,255,0)";
const LIFTED_SHADOW = "0px 20px 36px -12px rgba(0,0,0,0.95), 0px 0px 0px 1px rgba(255,255,255,0.25)";

/** Keeps a press on a nested control from starting a drag on the card around it. */
const stop = (event: SyntheticEvent) => event.stopPropagation();

interface TierCardProps {
  item: Item;
  /** Rendered inside the drag overlay, following the pointer. */
  overlay?: boolean;
  /** The slot left behind while this item is being dragged. */
  placeholder?: boolean;
  onEdit?: () => void;
}

export function TierCard({ item, overlay, placeholder, onEdit }: TierCardProps) {
  return (
    <motion.div
      initial={overlay ? { boxShadow: RESTING_SHADOW } : { opacity: 0, scale: 0.92 }}
      animate={overlay ? { boxShadow: LIFTED_SHADOW } : { opacity: 1, scale: 1 }}
      transition={spring}
      className={cn(
        "tier-card group relative w-16 rounded-lg select-none sm:w-20 lg:w-24",
        overlay ? "cursor-grabbing" : "cursor-grab",
        placeholder && "opacity-30",
      )}
    >
      <div
        className={cn(
          "relative aspect-[2/3] overflow-hidden rounded-lg border transition-colors duration-150",
          overlay ? "border-white/30" : "border-border group-hover:border-border-strong",
        )}
      >
        <ItemCover
          key={item.coverImageUrl}
          title={item.title}
          src={item.coverImageUrl}
          className="size-full"
        />
        {item.notes && (
          <span
            className="absolute bottom-1 left-1 size-1.5 rounded-full bg-primary shadow-[0_0_0_2px_rgba(0,0,0,0.6)]"
            aria-hidden
          />
        )}
      </div>

      <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-neutral-300">{item.title}</p>

      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          onPointerDown={stop}
          onMouseDown={stop}
          onTouchStart={stop}
          onKeyDown={stop}
          aria-label={`Edit ${item.title}`}
          className={cn(
            "absolute top-1 right-1 flex size-6 items-center justify-center rounded-md bg-black/75 text-foreground backdrop-blur-sm transition-opacity",
            "opacity-100 hover:bg-black focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
          )}
        >
          <Pencil className="size-3" />
        </button>
      )}
    </motion.div>
  );
}
