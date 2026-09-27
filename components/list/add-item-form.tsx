"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, inputClasses } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { isHttpUrl } from "@/lib/text";
import type { NewItem } from "@/types/list";

const EMPTY = { title: "", description: "", coverImageUrl: "", notes: "" };

interface AddItemFormProps {
  /** Where a new item will appear, e.g. "lands in Unranked". */
  landingLabel: string;
  autoFocus?: boolean;
  onAdd: (input: NewItem) => Promise<unknown>;
}

export function AddItemForm({ landingLabel, autoFocus, onAdd }: AddItemFormProps) {
  const id = useId();
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) titleRef.current?.focus();
  }, [autoFocus]);

  function set(field: keyof typeof EMPTY, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!values.title.trim()) {
      setError("Give it a title first.");
      titleRef.current?.focus();
      return;
    }
    const cover = values.coverImageUrl.trim();
    if (cover && !isHttpUrl(cover)) {
      setError("Cover URL should start with http:// or https://.");
      return;
    }

    setPending(true);
    try {
      await onAdd(values);
      setValues(EMPTY);
      setError(null);
      titleRef.current?.focus();
    } catch (err) {
      console.error(err);
      setError("Couldn't save that item. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-line bg-surface/60 p-4 sm:p-5"
      aria-labelledby={`${id}-heading`}
    >
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 id={`${id}-heading`} className="text-sm font-semibold text-white">
          Add an item
        </h2>
        <span className="font-mono text-xs text-faint">{landingLabel}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" htmlFor={`${id}-title`} className="sm:col-span-2">
          <input
            ref={titleRef}
            id={`${id}-title`}
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. The Stand"
            autoComplete="off"
            aria-invalid={error !== null && !values.title.trim()}
            className={inputClasses}
          />
        </Field>
        <Field label="Description" htmlFor={`${id}-description`} optional>
          <input
            id={`${id}-description`}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="1978 · post-apocalyptic epic"
            autoComplete="off"
            className={inputClasses}
          />
        </Field>
        <Field label="Cover image URL" htmlFor={`${id}-cover`} optional>
          <input
            id={`${id}-cover`}
            type="url"
            inputMode="url"
            value={values.coverImageUrl}
            onChange={(e) => set("coverImageUrl", e.target.value)}
            placeholder="https://…"
            autoComplete="off"
            className={inputClasses}
          />
        </Field>
        <Field label="Notes" htmlFor={`${id}-notes`} optional className="sm:col-span-2">
          <textarea
            id={`${id}-notes`}
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Why it sits where it does"
            rows={2}
            className={cn(inputClasses, "resize-y")}
          />
        </Field>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
        <Button type="submit" disabled={pending}>
          <PlusIcon />
          Add to list
        </Button>
      </div>
    </form>
  );
}
