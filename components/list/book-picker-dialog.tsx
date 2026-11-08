"use client";

import { Check, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { ItemCover } from "@/components/item-cover";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { saveErrorMessage } from "@/lib/text";
import { stacksBookRef, type StacksBook } from "@/lib/stacks-ref";
import type { NewItem } from "@/types/list";

interface BookPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where a new item will appear, e.g. "It lands in Unranked." */
  landingLabel?: string;
  /** Source refs already on the list, so those books show as added. */
  onList: Set<string>;
  onSubmit: (values: NewItem) => Promise<unknown>;
  /** Switch to the free-text item form. */
  onManual: () => void;
}

/** "Add a book" on a Books list: search your Stacks shelf, tap a book to add it. */
export function BookPickerDialog({
  open,
  onOpenChange,
  landingLabel,
  onList,
  onSubmit,
  onManual,
}: BookPickerDialogProps) {
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add a book"
      description={`From your Stacks shelf. ${landingLabel ?? ""}`.trim()}
      autoFocus
    >
      <BookPicker
        onList={onList}
        onSubmit={onSubmit}
        onManual={onManual}
        onDone={() => onOpenChange(false)}
      />
    </ResponsiveModal>
  );
}

type Results = { status: "loading" } | { status: "error" } | { status: "ready"; books: StacksBook[] };

function BookPicker({
  onList,
  onSubmit,
  onManual,
  onDone,
}: Pick<BookPickerDialogProps, "onList" | "onSubmit" | "onManual"> & { onDone: () => void }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>({ status: "loading" });
  const [adding, setAdding] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  // Debounced search; an empty query lists the most recently read books.
  useEffect(() => {
    const request = ++latest.current;
    const timer = setTimeout(
      async () => {
        try {
          const response = await fetch(`/api/stacks/search?q=${encodeURIComponent(query.trim())}`);
          if (!response.ok) throw new Error(`Search answered ${response.status}.`);
          const { books } = (await response.json()) as { books: StacksBook[] };
          if (latest.current === request) setResults({ status: "ready", books });
        } catch (err) {
          console.error(err);
          if (latest.current === request) setResults({ status: "error" });
        }
      },
      query.trim() ? 250 : 0,
    );
    return () => clearTimeout(timer);
  }, [query]);

  async function add(book: StacksBook) {
    setAdding(book.id);
    setError(null);
    try {
      await onSubmit({
        title: book.title,
        sourceRef: stacksBookRef(book.id),
        ...(book.author ? { author: book.author } : {}),
        ...(book.coverUrl ? { coverImageUrl: book.coverUrl } : {}),
      });
      onDone();
    } catch (err) {
      console.error(err);
      setError(saveErrorMessage(err, "Couldn't add that book. Try again."));
      setAdding(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
        <Input
          id={`${id}-search`}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your shelf"
          autoComplete="off"
          aria-label="Search your Stacks shelf"
          className="pl-9"
        />
      </div>

      {results.status === "error" ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Couldn&apos;t reach Stacks. Is it running?
        </p>
      ) : results.status === "ready" && results.books.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {query.trim() ? "Nothing on your shelf matches that." : "Your shelf is empty."}
        </p>
      ) : (
        <ul className="-mx-2 flex min-h-48 flex-col" aria-busy={results.status === "loading"}>
          {results.status === "ready" &&
            results.books.map((book) => {
              const added = onList.has(stacksBookRef(book.id));
              return (
                <li key={book.id}>
                  <button
                    type="button"
                    onClick={() => void add(book)}
                    disabled={added || adding !== null}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
                      "hover:bg-accent focus-visible:bg-accent disabled:hover:bg-transparent",
                      added && "opacity-50",
                      adding !== null && adding !== book.id && "opacity-60",
                    )}
                  >
                    <ItemCover
                      key={book.coverUrl}
                      title={book.title}
                      src={book.coverUrl ?? undefined}
                      className="aspect-[2/3] w-10 rounded-md border border-border"
                      initialsClassName="text-xs"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground" title={book.title}>
                        {book.title}
                      </span>
                      {book.author && (
                        <span className="block truncate text-sm text-muted-foreground">{book.author}</span>
                      )}
                    </span>
                    {added ? (
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <Check className="size-3.5" />
                        On this list
                      </span>
                    ) : adding === book.id ? (
                      <span className="shrink-0 text-xs text-muted-foreground">Adding...</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
        </ul>
      )}

      {error && <FieldError>{error}</FieldError>}

      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <p className="text-sm text-muted-foreground">Not on your shelf?</p>
        <Button variant="outline" onClick={onManual}>
          Add without Stacks
        </Button>
      </div>
    </div>
  );
}
