"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { ArrowLeft, ImageDown, Pencil, Plus, Rows3 } from "lucide-react";
import { ItemDialog } from "@/components/list/item-dialog";
import { ModeToggle } from "@/components/list/mode-toggle";
import { RankedList } from "@/components/list/ranked-list";
import { ListDialog } from "@/components/lists/list-dialog";
import { ErrorState, ListNotFound, SkeletonRows } from "@/components/status";
import { TierBoard } from "@/components/tier/tier-board";
import { TierSummary } from "@/components/tier/tier-summary";
import { Button } from "@/components/ui/button";
import { useList } from "@/hooks/use-list";
import type { Item, List } from "@/types/list";

type DialogState = { kind: "add-item" } | { kind: "edit-item"; item: Item } | { kind: "edit-list" };

export function ListDetail({ id, initialList }: { id: string; initialList?: List | null }) {
  const router = useRouter();
  const {
    list,
    status,
    reorder,
    moveToTier,
    setTiers,
    setRankingMode,
    addItem,
    saveItem,
    deleteItem,
    updateDetails,
    deleteList,
  } = useList(id, initialList);
  // `dialog` outlives `open` so a closing dialog keeps its content through the exit animation.
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [open, setOpen] = useState(false);
  const show = (next: DialogState) => {
    setDialog(next);
    setOpen(true);
  };

  useEffect(() => {
    if (list) document.title = `${list.title} · rankd`;
  }, [list]);

  const editItem = (itemId: string) => {
    const item = list?.items.find((candidate) => candidate.id === itemId);
    if (item) show({ kind: "edit-item", item });
  };

  const addButton = (
    <Button size="lg" onClick={() => show({ kind: "add-item" })}>
      <Plus />
      Add item
    </Button>
  );

  return (
    <div>
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        All lists
      </Link>

      {status === "loading" && <SkeletonRows count={4} />}
      {status === "error" && <ErrorState message="Something went wrong loading this list." />}
      {status === "not-found" && <ListNotFound />}

      {status === "ready" && list && (
        <>
          <header className="mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="min-w-0 text-3xl font-semibold tracking-tight text-balance">{list.title}</h1>
              <div className="flex shrink-0 gap-2">
                {list.items.length > 0 && (
                  <Button
                    variant="outline"
                    size="lg"
                    render={<Link href={`/list/${list.id}/share`} />}
                    nativeButton={false}
                  >
                    <ImageDown />
                    Share
                  </Button>
                )}
                <Button variant="outline" size="lg" onClick={() => show({ kind: "edit-list" })}>
                  <Pencil />
                  Edit list
                </Button>
                {list.items.length > 0 && addButton}
              </div>
            </div>
            {list.description && <p className="mt-2 max-w-3xl text-muted-foreground">{list.description}</p>}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              {list.rankingMode === "tier" ? (
                <TierSummary items={list.items} tiers={list.tiers} />
              ) : (
                <p className="text-sm text-muted-foreground tabular-nums">
                  {list.items.length} {list.items.length === 1 ? "item" : "items"} ranked
                </p>
              )}
              <ModeToggle mode={list.rankingMode} onChange={setRankingMode} />
            </div>
          </header>

          <section aria-label="Ranking">
            {list.items.length === 0 ? (
              <EmptyState
                icon={<Rows3 className="size-5" />}
                title="Add your first item to start ranking."
                body={
                  list.rankingMode === "tier"
                    ? "New items land in Unranked. Drag them up into a tier from there."
                    : "Once there are a few, drag the handles to put them in order."
                }
                action={addButton}
              />
            ) : list.rankingMode === "tier" ? (
              <>
                <TierBoard
                  items={list.items}
                  tiers={list.tiers}
                  onMove={moveToTier}
                  onEditItem={editItem}
                  onTiersChange={setTiers}
                />
                <p className="mt-3 text-xs text-faint">
                  Drag cards between tiers (press and hold on touch). Keyboard: focus a card, space to pick
                  up, arrows to move. The pencil edits an item. Click a tier&apos;s label to rename, recolour,
                  move or delete it.
                </p>
              </>
            ) : (
              <>
                <RankedList items={list.items} tiers={list.tiers} onReorder={reorder} onEditItem={editItem} />
                <p className="mt-3 text-xs text-faint">
                  Drag the handle to reorder, or focus it and use space + arrow keys. Tap an item to edit it.
                </p>
              </>
            )}
          </section>

          {dialog?.kind === "add-item" && (
            <ItemDialog
              open={open}
              onOpenChange={setOpen}
              landingLabel={
                list.rankingMode === "tier"
                  ? "It lands in Unranked."
                  : `It lands at #${list.items.length + 1}.`
              }
              onSubmit={addItem}
            />
          )}

          {dialog?.kind === "edit-item" && (
            <ItemDialog
              key={dialog.item.id}
              open={open}
              onOpenChange={setOpen}
              item={dialog.item}
              onSubmit={(values) => saveItem(dialog.item.id, values)}
              onRemove={() => {
                setOpen(false);
                deleteItem(dialog.item.id);
              }}
            />
          )}

          {dialog?.kind === "edit-list" && (
            <ListDialog
              open={open}
              onOpenChange={setOpen}
              list={list}
              onSubmit={async (values) => {
                await updateDetails(values);
                setOpen(false);
              }}
              onDelete={async () => {
                await deleteList();
                router.push("/");
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
