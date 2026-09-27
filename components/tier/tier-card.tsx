"use client";

import { motion } from "framer-motion";
import { useState, type SyntheticEvent } from "react";
import { PencilIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
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
  /** Its details panel is open. */
  selected?: boolean;
  onToggleDetails?: () => void;
}

export function TierCard({ item, overlay, placeholder, selected, onToggleDetails }: TierCardProps) {
  return (
    <motion.div
      initial={overlay ? { boxShadow: RESTING_SHADOW } : { opacity: 0, scale: 0.92 }}
      animate={overlay ? { boxShadow: LIFTED_SHADOW } : { opacity: 1, scale: 1 }}
      transition={spring}
      className={cn(
        "tier-card group relative w-16 rounded-lg select-none sm:w-20",
        overlay ? "cursor-grabbing" : "cursor-grab",
        placeholder && "opacity-30",
      )}
    >
      <div
        className={cn(
          "tier-cover relative aspect-[2/3] overflow-hidden rounded-lg border bg-surface-raised transition-[translate,border-color] duration-200",
          overlay
            ? "border-white/30"
            : "border-line group-hover:-translate-y-0.5 group-hover:border-line-strong",
          selected && "border-white/70 ring-2 ring-white/40",
        )}
      >
        <Cover item={item} />
        {item.notes && (
          <span
            className="absolute bottom-1 left-1 size-1.5 rounded-full bg-accent shadow-[0_0_0_2px_rgba(0,0,0,0.6)]"
            aria-hidden
          />
        )}
      </div>

      <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-neutral-300">{item.title}</p>

      {onToggleDetails && (
        <button
          type="button"
          onClick={onToggleDetails}
          onPointerDown={stop}
          onMouseDown={stop}
          onTouchStart={stop}
          onKeyDown={stop}
          aria-label={`${selected ? "Close" : "Open"} notes for ${item.title}`}
          aria-expanded={selected}
          className={cn(
            "absolute top-1 right-1 flex size-6 items-center justify-center rounded-md bg-black/75 text-white backdrop-blur-sm transition-opacity",
            "hover:bg-black focus-visible:opacity-100",
            selected ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
          )}
        >
          <PencilIcon width={12} height={12} />
        </button>
      )}
    </motion.div>
  );
}

function Cover({ item }: { item: Item }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = item.coverImageUrl;

  if (src && failedSrc !== src) {
    return (
      // Covers are arbitrary user-supplied URLs, so next/image's host allowlist doesn't fit.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        loading="lazy"
        draggable={false}
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(src)}
        className="size-full object-cover"
      />
    );
  }

  return (
    <div className="flex size-full items-center justify-center bg-linear-to-br from-neutral-800 to-neutral-950 p-1.5 text-center">
      <span className="font-mono text-lg font-semibold text-neutral-400">{initials(item.title)}</span>
    </div>
  );
}

function initials(title: string): string {
  const words = title
    .replace(/^(the|a|an)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  return (
    words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
}
