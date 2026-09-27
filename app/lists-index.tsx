"use client";

import { ListIcon } from "@/components/icons";
import { CreateListForm } from "@/components/lists/create-list-form";
import { ListCard } from "@/components/lists/list-card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState, SkeletonRows } from "@/components/status";
import { useLists } from "@/hooks/use-lists";

export function ListsIndex() {
  const { lists, status, createList } = useLists();

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your rankings</h1>
          <p className="mt-1.5 text-sm text-muted">Everything you&apos;ve put in order.</p>
        </div>
      </div>

      <CreateListForm onCreate={createList} startOpen={status === "ready" && lists.length === 0} />

      <div className="mt-6">
        {status === "loading" && <SkeletonRows count={2} tall />}
        {status === "error" && <ErrorState />}
        {status === "ready" &&
          (lists.length === 0 ? (
            <EmptyState
              icon={<ListIcon width={20} height={20} />}
              title="No lists yet — create your first ranking."
              body="Books, albums, burritos, playoff teams. If it can be argued about, it can be ranked."
            />
          ) : (
            <ul className="grid gap-3">
              {lists.map((list) => (
                <li key={list.id}>
                  <ListCard list={list} />
                </li>
              ))}
            </ul>
          ))}
      </div>
    </div>
  );
}
