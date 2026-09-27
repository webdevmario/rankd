"use client";

import { Trash2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { List } from "@/types/list";

export interface ListValues {
  title: string;
  description: string;
}

interface ListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The list being edited. Leave out to create a new one. */
  list?: List;
  onSubmit: (values: ListValues) => Promise<unknown>;
  onDelete?: () => Promise<unknown>;
}

/** Create a list, or rename, redescribe and delete an existing one. */
export function ListDialog({ open, onOpenChange, list, onSubmit, onDelete }: ListDialogProps) {
  const editing = list !== undefined;
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit list" : "New list"}
      autoFocus={!editing}
    >
      <ListForm list={list} onSubmit={onSubmit} onDelete={onDelete} onDone={() => onOpenChange(false)} />
    </ResponsiveModal>
  );
}

interface ListFormProps {
  list?: List;
  onSubmit: (values: ListValues) => Promise<unknown>;
  onDelete?: () => Promise<unknown>;
  onDone: () => void;
}

function ListForm({ list, onSubmit, onDelete, onDone }: ListFormProps) {
  const id = useId();
  const editing = list !== undefined;
  const [title, setTitle] = useState(list?.title ?? "");
  const [description, setDescription] = useState(list?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const count = list?.items.length ?? 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Every ranking needs a name.");
      return;
    }
    setPending(true);
    try {
      await onSubmit({ title, description });
    } catch (err) {
      console.error(err);
      setError(editing ? "Couldn't save. Try again." : "Couldn't create the list. Try again.");
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setPending(true);
    try {
      await onDelete();
    } catch (err) {
      console.error(err);
      setError("Couldn't delete the list. Try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup className="gap-4">
        <Field data-invalid={error !== null && !title.trim()}>
          <FieldLabel htmlFor={`${id}-title`}>Title</FieldLabel>
          <Input
            id={`${id}-title`}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            placeholder="e.g. Best Pixar movies"
            autoComplete="off"
            aria-invalid={error !== null && !title.trim()}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-description`}>
            Description <span className="font-normal text-faint">optional</span>
          </FieldLabel>
          <Textarea
            id={`${id}-description`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's being ranked, and by what measure?"
            rows={3}
          />
        </Field>

        {error && <FieldError>{error}</FieldError>}

        <div className="flex items-center justify-between gap-3 pt-1">
          {editing && onDelete ? (
            <ConfirmDialog
              title={`Delete "${list.title}"?`}
              description={`This permanently removes the list and its ${count} ${count === 1 ? "item" : "items"}. It can't be undone.`}
              confirmLabel="Delete forever"
              cancelLabel="Keep it"
              onConfirm={handleDelete}
              trigger={
                <Button variant="ghost" size="lg" className="text-muted-foreground hover:text-destructive">
                  <Trash2 />
                  Delete list
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
              {editing ? "Save" : "Create list"}
            </Button>
          </div>
        </div>
      </FieldGroup>
    </form>
  );
}
