"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { inputClasses } from "@/components/ui/field";
import { cn } from "@/lib/cn";

interface NotesEditorProps {
  itemTitle: string;
  notes?: string;
  onSave?: (notes: string) => void;
}

function autosize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

/**
 * Shows notes as a clamped preview; click to expand into an inline editor.
 * Saves on blur (or ⌘/Ctrl+Enter); Escape discards the draft.
 */
export function NotesEditor({ itemTitle, notes, onSave }: NotesEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes ?? "");
  const discardRef = useRef(false);

  // AnimatePresence mounts the textarea only after the preview has exited, so
  // focus from the ref callback rather than an effect keyed on `editing`.
  const focusOnMount = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    autosize(el);
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  if (!onSave) {
    return notes ? <p className="mt-2 line-clamp-2 text-sm text-neutral-300">{notes}</p> : null;
  }

  function startEditing() {
    discardRef.current = false;
    setDraft(notes ?? "");
    setEditing(true);
  }

  function finishEditing() {
    setEditing(false);
    if (discardRef.current) return;
    if (draft.trim() !== (notes ?? "").trim()) onSave?.(draft);
  }

  return (
    <div className="mt-2">
      <AnimatePresence initial={false} mode="wait">
        {editing ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <textarea
              ref={focusOnMount}
              value={draft}
              rows={2}
              aria-label={`Notes for ${itemTitle}`}
              placeholder="What stuck with you?"
              className={cn(inputClasses, "block resize-none leading-relaxed")}
              onChange={(event) => {
                setDraft(event.target.value);
                autosize(event.target);
              }}
              onBlur={finishEditing}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  discardRef.current = true;
                  event.currentTarget.blur();
                } else if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
              }}
            />
            <p className="mt-1 text-[11px] text-faint">Saves when you click away · Esc to cancel</p>
          </motion.div>
        ) : (
          <motion.button
            key="preview"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={startEditing}
            aria-label={notes ? `Edit notes for ${itemTitle}` : `Add a note for ${itemTitle}`}
            className={cn(
              "block w-full rounded-md text-left text-sm transition-colors",
              notes
                ? "line-clamp-2 whitespace-pre-line text-neutral-300 hover:text-white"
                : "text-faint hover:text-muted",
            )}
          >
            {notes || "+ Add a note"}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
