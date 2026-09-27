"use client";

import Link from "next/link";
import { useEffect } from "react";
import { EmptyState } from "@/components/empty-state";
import { ArrowLeftIcon, ListIcon, SlidersIcon } from "@/components/icons";
import { AddItemForm } from "@/components/list/add-item-form";
import { RankedList } from "@/components/list/ranked-list";
import { ErrorState, ListNotFound, SkeletonRows } from "@/components/status";
import { buttonClasses } from "@/components/ui/button";
import { useList } from "@/hooks/use-list";
import { cn } from "@/lib/cn";

export function ListDetail({ id }: { id: string }) {
  const { list, status, reorder, addItem, updateItem, deleteItem } = useList(id);

  useEffect(() => {
    if (list) document.title = `${list.title} · rankd`;
  }, [list]);

  return (
    <div>
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-white"
      >
        <ArrowLeftIcon width={14} height={14} />
        All lists
      </Link>

      {status === "loading" && <SkeletonRows count={4} />}
      {status === "error" && <ErrorState message="Something went wrong loading this list." />}
      {status === "not-found" && <ListNotFound />}

      {status === "ready" && list && (
        <>
          <header className="mb-8 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold tracking-tight text-balance">{list.title}</h1>
              {list.description && <p className="mt-2 text-muted">{list.description}</p>}
              <p className="mt-3 font-mono text-xs text-faint">
                {list.items.length} {list.items.length === 1 ? "item" : "items"} ranked
              </p>
            </div>
            <Link
              href={`/list/${list.id}/settings`}
              className={cn(buttonClasses("secondary", "sm"), "shrink-0")}
              aria-label="List settings"
            >
              <SlidersIcon width={14} height={14} />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </header>

          <section aria-label="Ranking" className="mb-8">
            {list.items.length === 0 ? (
              <EmptyState
                icon={<ListIcon width={20} height={20} />}
                title="Add your first item to start ranking."
                body="Use the form below. Once there are a few, drag the handles to put them in order."
              />
            ) : (
              <>
                <RankedList
                  items={list.items}
                  onReorder={reorder}
                  onUpdateItem={updateItem}
                  onRemoveItem={deleteItem}
                />
                <p className="mt-3 text-xs text-faint">
                  Drag the handle to reorder, or focus it and use space + arrow keys.
                </p>
              </>
            )}
          </section>

          <AddItemForm nextRank={list.items.length + 1} autoFocus={list.items.length === 0} onAdd={addItem} />
        </>
      )}
    </div>
  );
}
