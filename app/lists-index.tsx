"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { List, Plus } from "lucide-react";
import { ListCard } from "@/components/lists/list-card";
import { ListDialog } from "@/components/lists/list-dialog";
import { LocalImportBanner } from "@/components/lists/local-import-banner";
import { EmptyState } from "@/components/empty-state";
import { ErrorState, SkeletonRows } from "@/components/status";
import { Button } from "@/components/ui/button";
import { useLists } from "@/hooks/use-lists";

export function ListsIndex() {
  const router = useRouter();
  const { lists, status, createList, reload } = useLists();
  const [creating, setCreating] = useState(false);

  const newListButton = (
    <Button size="lg" onClick={() => setCreating(true)}>
      <Plus />
      New list
    </Button>
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your rankings</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Everything you&apos;ve put in order.</p>
        </div>
        {status === "ready" && lists.length > 0 && newListButton}
      </div>

      {status === "ready" && <LocalImportBanner onImported={reload} />}

      {status === "loading" && <SkeletonRows count={2} tall />}
      {status === "error" && <ErrorState />}
      {status === "ready" &&
        (lists.length === 0 ? (
          <EmptyState
            icon={<List className="size-5" />}
            title="No lists yet. Create your first ranking."
            body="Books, albums, burritos, playoff teams. If it can be argued about, it can be ranked."
            action={newListButton}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <li key={list.id}>
                <ListCard list={list} />
              </li>
            ))}
          </ul>
        ))}

      <ListDialog
        open={creating}
        onOpenChange={setCreating}
        onSubmit={async (values) => {
          const list = await createList(values);
          router.push(`/list/${list.id}`);
        }}
      />
    </div>
  );
}
