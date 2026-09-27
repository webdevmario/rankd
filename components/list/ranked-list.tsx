"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import type { Item, TierDef } from "@/types/list";
import { liftModifier, OVERLAY_STYLE, unliftedKeyboardCoordinates, useDropAnimation } from "./drag-effects";
import { ItemCard } from "./item-card";

const LIFT_SCALE = 1.02;
const lift = liftModifier(LIFT_SCALE);
const keyboardCoordinates = unliftedKeyboardCoordinates(LIFT_SCALE);

const screenReaderInstructions = {
  draggable:
    "To reorder, press space or enter on the drag handle. Use the up and down arrow keys to change the rank, space or enter to drop, or escape to cancel.",
};

interface RankedListProps {
  items: Item[];
  /** The list's tiers, for the chip on each card. */
  tiers: TierDef[];
  onReorder: (activeId: string, overId: string) => void;
  onEditItem: (itemId: string) => void;
}

export function RankedList({ items, tiers, onReorder, onEditItem }: RankedListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const dropAnimation = useDropAnimation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates }),
  );

  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const tierById = useMemo(() => new Map(tiers.map((tier) => [tier.id, tier])), [tiers]);
  const tierOf = (item: Item) => (item.tier ? tierById.get(item.tier) : undefined);
  const activeItem = activeId ? items.find((item) => item.id === activeId) : undefined;

  const rankOf = (id: UniqueIdentifier) => ids.indexOf(String(id)) + 1;
  const titleOf = (id: UniqueIdentifier) => items.find((item) => item.id === id)?.title ?? "Item";

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Picked up ${titleOf(active.id)}, ranked ${rankOf(active.id)} of ${items.length}.`,
    onDragOver: ({ active, over }) =>
      over ? `${titleOf(active.id)} moves to rank ${rankOf(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `${titleOf(active.id)} dropped at rank ${rankOf(over.id)}.` : `${titleOf(active.id)} dropped.`,
    onDragCancel: ({ active }) => `Cancelled. ${titleOf(active.id)} stays at rank ${rankOf(active.id)}.`,
  };

  function reset() {
    setActiveId(null);
    setOverId(null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    reset();
    if (over && active.id !== over.id) onReorder(String(active.id), String(over.id));
  }

  return (
    <DndContext
      id="ranked-list"
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={({ active }: DragStartEvent) => setActiveId(String(active.id))}
      onDragOver={({ over }: DragOverEvent) => setOverId(over ? String(over.id) : null)}
      onDragEnd={handleDragEnd}
      onDragCancel={reset}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol className="ranked-list flex flex-col gap-2" data-dragging={activeId !== null}>
          {items.map((item, index) => (
            <SortableItem
              key={item.id}
              item={item}
              tier={tierOf(item)}
              rank={index + 1}
              onEdit={() => onEditItem(item.id)}
            />
          ))}
        </ol>
      </SortableContext>

      <DragOverlay adjustScale modifiers={[lift]} dropAnimation={dropAnimation} style={OVERLAY_STYLE}>
        {activeItem ? (
          <ItemCard
            item={activeItem}
            tier={tierOf(activeItem)}
            rank={rankOf(overId ?? activeItem.id)}
            overlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface SortableItemProps {
  item: Item;
  tier?: TierDef;
  rank: number;
  onEdit: () => void;
}

function SortableItem({ item, tier, rank, onEdit }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }}>
      <ItemCard
        item={item}
        tier={tier}
        rank={rank}
        placeholder={isDragging}
        handleProps={{ ref: setActivatorNodeRef, ...attributes, ...listeners }}
        onEdit={onEdit}
      />
    </li>
  );
}
