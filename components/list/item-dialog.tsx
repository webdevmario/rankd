"use client";

import { Link2, Trash2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isCoverSrc, saveErrorMessage } from "@/lib/text";
import type { Item, NewItem } from "@/types/list";
import { ItemCover } from "@/components/item-cover";
import { CoverField } from "./cover-field";

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The item being edited. Leave out to add a new one. */
  item?: Item;
  /** Where a new item will appear, e.g. "It lands in Unranked." */
  landingLabel?: string;
  onSubmit: (values: NewItem) => Promise<unknown>;
  onRemove?: () => void;
}

/**
 * Add or edit an item: title, description, cover photo and notes. A Stacks
 * book's title and cover come from Stacks, so they show here read-only.
 */
export function ItemDialog({ open, onOpenChange, item, landingLabel, onSubmit, onRemove }: ItemDialogProps) {
  const editing = item !== undefined;
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit item" : "Add an item"}
      description={landingLabel}
      autoFocus={!editing}
    >
      <ItemForm item={item} onSubmit={onSubmit} onRemove={onRemove} onDone={() => onOpenChange(false)} />
    </ResponsiveModal>
  );
}

interface ItemFormProps {
  item?: Item;
  onSubmit: (values: NewItem) => Promise<unknown>;
  onRemove?: () => void;
  onDone: () => void;
}

function ItemForm({ item, onSubmit, onRemove, onDone }: ItemFormProps) {
  const id = useId();
  const editing = item !== undefined;
  const linked = Boolean(item?.sourceRef);
  const [values, setValues] = useState({
    title: item?.title ?? "",
    description: item?.description ?? "",
    coverImageUrl: item?.coverImageUrl ?? "",
    notes: item?.notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const titleMissing = error !== null && !values.title.trim();

  function set(field: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!values.title.trim()) {
      setError("Give it a title first.");
      return;
    }
    const cover = values.coverImageUrl.trim();
    if (!linked && cover && !isCoverSrc(cover)) {
      setError("Cover URL should start with http:// or https://.");
      return;
    }

    setPending(true);
    try {
      await onSubmit(values);
      onDone();
    } catch (err) {
      console.error(err);
      setError(saveErrorMessage(err, "Couldn't save that item. Try again."));
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup className="gap-4">
        {linked && item ? (
          <div className="flex gap-3 rounded-lg border bg-card p-3">
            <ItemCover
              key={item.coverImageUrl}
              title={item.title}
              src={item.coverImageUrl}
              className="aspect-[2/3] w-12 rounded-md border"
              initialsClassName="text-sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold" title={item.title}>
                {item.title}
              </p>
              {item.author && <p className="truncate text-sm text-muted-foreground">{item.author}</p>}
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-faint">
                <Link2 className="size-3.5 shrink-0" />
                From Stacks. Change the title or cover there.
              </p>
            </div>
          </div>
        ) : (
          <Field data-invalid={titleMissing}>
            <FieldLabel htmlFor={`${id}-title`}>Title</FieldLabel>
            <Input
              id={`${id}-title`}
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. The Stand"
              autoComplete="off"
              aria-invalid={titleMissing}
            />
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor={`${id}-description`}>
            Description <span className="font-normal text-faint">optional</span>
          </FieldLabel>
          <Input
            id={`${id}-description`}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="1978, post-apocalyptic epic"
            autoComplete="off"
          />
        </Field>
        {!linked && (
          <Field>
            <FieldLabel htmlFor={`${id}-cover`}>
              Cover <span className="font-normal text-faint">optional</span>
            </FieldLabel>
            <CoverField
              id={`${id}-cover`}
              title={values.title}
              value={values.coverImageUrl}
              onChange={(value) => set("coverImageUrl", value)}
              onError={setError}
            />
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor={`${id}-notes`}>
            Notes <span className="font-normal text-faint">optional</span>
          </FieldLabel>
          <Textarea
            id={`${id}-notes`}
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Why it sits where it does"
            rows={4}
            className="min-h-24 leading-relaxed"
          />
        </Field>

        {error && <FieldError>{error}</FieldError>}

        <div className="flex items-center justify-between gap-3 pt-1">
          {onRemove && item ? (
            <ConfirmDialog
              title={`Remove "${item.title}"?`}
              description="It comes off this list for good, notes and cover included."
              confirmLabel="Remove"
              cancelLabel="Keep it"
              onConfirm={onRemove}
              trigger={
                <Button variant="ghost" size="lg" className="text-muted-foreground hover:text-destructive">
                  <Trash2 />
                  Remove
                </Button>
              }
            />
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="lg" onClick={onDone}>
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={pending}>
              {editing ? "Save" : "Add to list"}
            </Button>
          </div>
        </div>
      </FieldGroup>
    </form>
  );
}
