"use client";

import {
  ArrowDown,
  ArrowUp,
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  Check,
  Trash2,
} from "lucide-react";
import { cloneElement, useEffect, useRef, useState, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMediaQuery } from "@/hooks/use-media-query";
import { TIER_COLOR_FILL, TIER_COLOR_NAME } from "@/lib/tier-colors";
import { cn } from "@/lib/utils";
import { MAX_TIER_LABEL, MAX_TIERS, TIER_COLORS, type TierColor, type TierDef } from "@/types/list";

/** How long typing pauses before a new name is saved. */
const RENAME_DELAY_MS = 500;

export interface TierEditorActions {
  onRename: (label: string) => void;
  onRecolor: (color: TierColor) => void;
  onMove: (delta: -1 | 1) => void;
  onInsert: (where: "above" | "below") => void;
  onDelete: () => void;
}

interface TierEditorProps extends TierEditorActions {
  tier: TierDef;
  index: number;
  tierCount: number;
  itemCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The tier's label cell. It opens the editor. */
  trigger: ReactElement<Record<string, unknown>>;
}

/**
 * Edits one tier row: name, colour, position, and delete. A popover beside the
 * label on desktop; a bottom sheet on phones.
 */
export function TierEditor({ open, onOpenChange, trigger, ...panel }: TierEditorProps) {
  const desktop = useMediaQuery("(min-width: 640px)");

  if (desktop) {
    return (
      <Popover open={open} onOpenChange={(next) => onOpenChange(next)}>
        <PopoverTrigger render={trigger} />
        <PopoverContent side="right" align="start" sideOffset={10} className="w-80 gap-0 p-4">
          <TierEditorPanel {...panel} autoFocus onDone={() => onOpenChange(false)} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
      {cloneElement(trigger, { onClick: () => onOpenChange(true) })}
      <Drawer open={open} onOpenChange={(next) => onOpenChange(next)} showSwipeHandle>
        <DrawerContent>
          <DrawerHeader className="px-5 text-left">
            <DrawerTitle className="text-lg font-semibold">Edit tier</DrawerTitle>
          </DrawerHeader>
          <div className="px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <TierEditorPanel {...panel} onDone={() => onOpenChange(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

interface TierEditorPanelProps extends TierEditorActions {
  tier: TierDef;
  index: number;
  tierCount: number;
  itemCount: number;
  autoFocus?: boolean;
  onDone: () => void;
}

function TierEditorPanel({
  tier,
  index,
  tierCount,
  itemCount,
  autoFocus,
  onDone,
  onRename,
  onRecolor,
  onMove,
  onInsert,
  onDelete,
}: TierEditorPanelProps) {
  const [draft, setDraft] = useState(tier.label);
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saved = useRef(tier.label);

  const commit = (value: string) => {
    clearTimeout(timer.current);
    const label = value.trim();
    if (label && label !== saved.current) {
      saved.current = label;
      onRename(label);
    }
  };

  // Save a pending name if the editor closes mid-pause.
  const pending = useRef(draft);
  pending.current = draft;
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      const label = pending.current.trim();
      if (label && label !== saved.current) onRename(label);
    },
    // Only on unmount. The board's handlers read the latest tiers from a ref, so this one is safe to call late.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const full = tierCount >= MAX_TIERS;
  const deleteTier = () => {
    if (itemCount > 0 && !confirming) return setConfirming(true);
    onDelete();
    onDone();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor={`tier-name-${tier.id}`} className="text-xs font-medium text-muted-foreground">
          Name
        </label>
        <Input
          id={`tier-name-${tier.id}`}
          value={draft}
          maxLength={MAX_TIER_LABEL}
          autoFocus={autoFocus}
          autoComplete="off"
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            const value = event.target.value;
            setDraft(value);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => commit(value), RENAME_DELAY_MS);
          }}
          onBlur={() => commit(draft)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit(draft);
              onDone();
            }
          }}
          className="h-10 text-base font-semibold"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Colour</span>
        <div className="grid grid-cols-7 gap-2" role="radiogroup" aria-label="Colour">
          {TIER_COLORS.map((color) => {
            const selected = tier.color === color;
            return (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={TIER_COLOR_NAME[color]}
                title={TIER_COLOR_NAME[color]}
                onClick={() => {
                  if (!selected) onRecolor(color);
                }}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-full text-black transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover",
                  selected && "ring-2 ring-foreground ring-offset-2 ring-offset-popover",
                )}
                style={{ background: TIER_COLOR_FILL[color] }}
              >
                {selected && <Check className="size-3.5" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => onMove(-1)} disabled={index === 0}>
          <ArrowUp />
          Move up
        </Button>
        <Button variant="outline" onClick={() => onMove(1)} disabled={index === tierCount - 1}>
          <ArrowDown />
          Move down
        </Button>
        <Button variant="outline" onClick={() => onInsert("above")} disabled={full}>
          <BetweenHorizontalStart />
          Add above
        </Button>
        <Button variant="outline" onClick={() => onInsert("below")} disabled={full}>
          <BetweenHorizontalEnd />
          Add below
        </Button>
      </div>

      <div className="border-t pt-4">
        {confirming ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Delete <span className="font-semibold text-foreground">{tier.label}</span>? Its {itemCount}{" "}
              {itemCount === 1 ? "item goes" : "items go"} back to Unranked.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={deleteTier}>
                <Trash2 />
                Delete tier
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={deleteTier}
            disabled={tierCount === 1}
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            <Trash2 />
            Delete tier
          </Button>
        )}
      </div>
    </div>
  );
}
