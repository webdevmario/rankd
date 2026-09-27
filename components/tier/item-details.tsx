"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CloseIcon, TrashIcon } from "@/components/icons";
import { CoverThumb } from "@/components/list/cover-thumb";
import { NotesEditor } from "@/components/list/notes-editor";
import { cn } from "@/lib/cn";
import type { Item, ItemPatch } from "@/types/list";

interface ItemDetailsProps {
  item: Item;
  onUpdate: (patch: ItemPatch) => void;
  onRemove: () => void;
  onClose: () => void;
}

/** Inline panel that opens under a tier row: full title, description, notes, remove. */
export function ItemDetails({ item, onUpdate, onRemove, onClose }: ItemDetailsProps) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const typing = event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement;
      if (event.key === "Escape" && !typing) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <div className="flex gap-3 border-t border-line bg-surface-raised/60 p-3">
        {item.coverImageUrl && <CoverThumb key={item.coverImageUrl} src={item.coverImageUrl} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="leading-snug font-semibold text-white">{item.title}</h3>
              {item.description && <p className="mt-0.5 text-sm text-muted">{item.description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notes"
              className="-mt-1 -mr-1 flex size-7 shrink-0 items-center justify-center rounded-md text-faint hover:bg-white/5 hover:text-white"
            >
              <CloseIcon width={14} height={14} />
            </button>
          </div>

          <NotesEditor itemTitle={item.title} notes={item.notes} onSave={(notes) => onUpdate({ notes })} />

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => (confirmingRemove ? onRemove() : setConfirmingRemove(true))}
              onBlur={() => setConfirmingRemove(false)}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-md px-2 text-xs transition-colors",
                confirmingRemove
                  ? "bg-danger/15 text-danger"
                  : "text-faint hover:bg-white/5 hover:text-white",
              )}
            >
              <TrashIcon width={13} height={13} />
              {confirmingRemove ? "Remove from list?" : "Remove"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
