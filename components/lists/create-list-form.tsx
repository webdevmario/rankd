"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, inputClasses } from "@/components/ui/field";
import type { List, NewList } from "@/types/list";

interface CreateListFormProps {
  onCreate: (input: NewList) => Promise<List>;
  startOpen?: boolean;
}

export function CreateListForm({ onCreate, startOpen = false }: CreateListFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(startOpen);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (startOpen) setOpen(true);
  }, [startOpen]);

  function close() {
    setOpen(false);
    setTitle("");
    setDescription("");
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Every ranking needs a name.");
      return;
    }
    setPending(true);
    try {
      const list = await onCreate({ title, description });
      router.push(`/list/${list.id}`);
    } catch (err) {
      console.error(err);
      setError("Couldn't create the list. Try again.");
      setPending(false);
    }
  }

  return (
    <AnimatePresence initial={false} mode="wait">
      {open ? (
        <motion.form
          key="form"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16 }}
          onSubmit={handleSubmit}
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
          noValidate
          className="rounded-2xl border border-line bg-surface/60 p-4 sm:p-5"
        >
          <h2 className="mb-4 text-sm font-semibold">New ranking</h2>
          <div className="grid gap-3">
            <Field label="Title" htmlFor="new-list-title">
              <input
                id="new-list-title"
                autoFocus
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. Best Pixar movies"
                autoComplete="off"
                className={inputClasses}
              />
            </Field>
            <Field label="Description" htmlFor="new-list-description" optional>
              <input
                id="new-list-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's being ranked, and by what measure?"
                autoComplete="off"
                className={inputClasses}
              />
            </Field>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                Create list
              </Button>
            </div>
          </div>
        </motion.form>
      ) : (
        <motion.div
          key="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <Button onClick={() => setOpen(true)}>
            <PlusIcon />
            New list
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
