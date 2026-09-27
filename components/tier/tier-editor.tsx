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

/** A tier's name and colour while they're being edited. */
export type TierDraft = Pick<TierDef, "label" | "color">;

export interface TierEditorActions {
  /** Commits a new name and colour. */
  onSave: (draft: TierDraft) => void;
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
  /** Live preview of unsaved changes, so the board's label can show them. Null clears it. */
  onPreview: (draft: TierDraft | null) => void;
  /** The tier's label cell. It opens the editor. */
  trigger: ReactElement<Record<string, unknown>>;
}

/**
 * Edits one tier row. Name and colour are a draft (previewed on the board)
 * that Save or Enter commits and Cancel, Escape or clicking away discards.
 * Move, add and delete act at once. A popover beside the label on desktop; a
 * bottom sheet on phones.
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
  onPreview: (draft: TierDraft | null) => void;
  onDone: () => void;
}

function TierEditorPanel({
  tier,
  index,
  tierCount,
  itemCount,
  autoFocus,
  onPreview,
  onDone,
  onSave,
  onMove,
  onInsert,
  onDelete,
}: TierEditorPanelProps) {
  const [label, setLabel] = useState(tier.label);
  const [color, setColor] = useState<TierColor>(tier.color);
  const [confirming, setConfirming] = useState(false);

  const trimmed = label.trim();
  const dirty = (trimmed !== "" && trimmed !== tier.label) || color !== tier.color;
  const draft = { label: trimmed || tier.label, color };

  // Show the draft on the board's label while editing; clear it when the editor goes away.
  const preview = useRef(onPreview);
  useEffect(() => {
    preview.current = onPreview;
  });
  useEffect(() => {
    preview.current(dirty ? { label: draft.label, color: draft.color } : null);
  }, [dirty, draft.label, draft.color]);
  useEffect(() => () => preview.current(null), []);

  /** Commits the name and colour without closing, so row actions don't lose them. */
  const saveDraft = () => {
    if (dirty) onSave(draft);
  };
  const save = () => {
    saveDraft();
    onDone();
  };

  const full = tierCount >= MAX_TIERS;
  const deleteTier = () => {
    if (itemCount > 0 && !confirming) return setConfirming(true);
    onDelete();
    onDone();
  };

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={`tier-name-${tier.id}`} className="text-xs font-medium text-muted-foreground">
          Name
        </label>
        <Input
          id={`tier-name-${tier.id}`}
          value={label}
          maxLength={MAX_TIER_LABEL}
          autoFocus={autoFocus}
          autoComplete="off"
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => setLabel(event.target.value)}
          aria-invalid={trimmed === ""}
          className="h-10 text-base font-semibold"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Colour</span>
        <div className="grid grid-cols-7 gap-2" role="radiogroup" aria-label="Colour">
          {TIER_COLORS.map((option) => {
            const selected = color === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={TIER_COLOR_NAME[option]}
                title={TIER_COLOR_NAME[option]}
                onClick={() => setColor(option)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-full text-black transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover",
                  selected && "ring-2 ring-foreground ring-offset-2 ring-offset-popover",
                )}
                style={{ background: TIER_COLOR_FILL[option] }}
              >
                {selected && <Check className="size-3.5" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            saveDraft();
            onMove(-1);
          }}
          disabled={index === 0}
        >
          <ArrowUp />
          Move up
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            saveDraft();
            onMove(1);
          }}
          disabled={index === tierCount - 1}
        >
          <ArrowDown />
          Move down
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            saveDraft();
            onInsert("above");
          }}
          disabled={full}
        >
          <BetweenHorizontalStart />
          Add above
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            saveDraft();
            onInsert("below");
          }}
          disabled={full}
        >
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
              <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={deleteTier}>
                <Trash2 />
                Delete tier
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={deleteTier}
              disabled={tierCount === 1}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onDone}>
                Cancel
              </Button>
              <Button type="submit" disabled={!dirty}>
                Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
