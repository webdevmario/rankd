"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeftIcon, TrashIcon } from "@/components/icons";
import { ErrorState, ListNotFound, SkeletonRows } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Field, inputClasses } from "@/components/ui/field";
import { useList } from "@/hooks/use-list";
import { cn } from "@/lib/cn";
import { SOURCE_LABELS } from "@/lib/sources";
import type { List, ListPatch } from "@/types/list";

export function ListSettings({ id }: { id: string }) {
  const { list, status, updateDetails, deleteList } = useList(id);

  return (
    <div>
      <Link
        href={`/list/${id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-white"
      >
        <ArrowLeftIcon width={14} height={14} />
        Back to list
      </Link>

      {status === "loading" && <SkeletonRows count={2} tall />}
      {status === "error" && <ErrorState message="Something went wrong loading this list." />}
      {status === "not-found" && <ListNotFound />}

      {status === "ready" && list && (
        <div className="grid gap-6">
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <DetailsForm list={list} onSave={updateDetails} />
          <SourceInfo list={list} />
          <DangerZone list={list} onDelete={deleteList} />
        </div>
      )}
    </div>
  );
}

const card = "rounded-2xl border border-line bg-surface/60 p-4 sm:p-5";

function DetailsForm({ list, onSave }: { list: List; onSave: (patch: ListPatch) => Promise<List> }) {
  const [title, setTitle] = useState(list.title);
  const [description, setDescription] = useState(list.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  const dirty = title.trim() !== list.title || (description.trim() || undefined) !== list.description;

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [saved]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Title can't be empty.");
      return;
    }
    setPending(true);
    try {
      const next = await onSave({ title, description });
      setTitle(next.title);
      setDescription(next.description ?? "");
      setError(null);
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Couldn't save. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={card}>
      <h2 className="mb-4 text-sm font-semibold">Details</h2>
      <div className="grid gap-3">
        <Field label="Title" htmlFor="list-title">
          <input
            id="list-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            autoComplete="off"
            className={inputClasses}
          />
        </Field>
        <Field label="Description" htmlFor="list-description" optional>
          <textarea
            id="list-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={cn(inputClasses, "resize-y")}
          />
        </Field>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <p role="status" className={cn("text-sm", error ? "text-danger" : "text-accent")}>
          {error ?? (saved ? "Saved" : null)}
        </p>
        <Button type="submit" disabled={!dirty || pending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

function SourceInfo({ list }: { list: List }) {
  return (
    <section className={card}>
      <h2 className="text-sm font-semibold">Item source</h2>
      <p className="mt-2 text-sm text-muted">
        <span className="rounded-md border border-line px-2 py-0.5 font-mono text-xs text-white">
          {SOURCE_LABELS[list.itemSourceType]}
        </span>
        <span className="ml-2">Items are added by hand. Imports from other sources are on the roadmap.</span>
      </p>
    </section>
  );
}

function DangerZone({ list, onDelete }: { list: List; onDelete: () => Promise<void> }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const count = list.items.length;

  async function handleDelete() {
    setPending(true);
    try {
      await onDelete();
      router.push("/");
    } catch (err) {
      console.error(err);
      setPending(false);
    }
  }

  return (
    <section className={cn(card, "border-danger/25")}>
      <h2 className="text-sm font-semibold text-danger">Delete list</h2>
      <p className="mt-2 text-sm text-muted">
        Permanently removes “{list.title}” and its {count} {count === 1 ? "item" : "items"}. This can&apos;t
        be undone.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        {confirming ? (
          <>
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
              Keep it
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={pending} autoFocus>
              <TrashIcon width={14} height={14} />
              Yes, delete forever
            </Button>
          </>
        ) : (
          <Button variant="danger" onClick={() => setConfirming(true)}>
            <TrashIcon width={14} height={14} />
            Delete list
          </Button>
        )}
      </div>
    </section>
  );
}
