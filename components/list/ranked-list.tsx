"use client";

import {
  closestCenter,
  defaultDropAnimationSideEffects,
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
  type DropAnimation,
  type Modifier,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import type { Item, ItemPatch } from "@/types/list";
import { ItemCard } from "./item-card";

const LIFT_SCALE = 1.02;

/**
 * Scales the drag overlay up slightly. The overlay's transform-origin is its
 * top-left corner (so dnd-kit's drop animation lands exactly), so we offset by
 * half the growth to keep the scale visually centred.
 */
const lift: Modifier = ({ transform, activeNodeRect }) => {
  if (!activeNodeRect) return transform;
  return {
    ...transform,
    x: transform.x - (activeNodeRect.width * (LIFT_SCALE - 1)) / 2,
    y: transform.y - (activeNodeRect.height * (LIFT_SCALE - 1)) / 2,
    scaleX: LIFT_SCALE,
    scaleY: LIFT_SCALE,
  };
};

/** Overshooting ease → the card springs back into its slot and scale settles to 1. */
const dropAnimation: DropAnimation = {
  duration: 340,
  easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0" } } }),
};

const screenReaderInstructions = {
  draggable:
    "To reorder, press space or enter on the drag handle. Use the up and down arrow keys to change the rank, space or enter to drop, or escape to cancel.",
};

interface RankedListProps {
  items: Item[];
  onReorder: (activeId: string, overId: string) => void;
  onUpdateItem: (itemId: string, patch: ItemPatch) => void;
  onRemoveItem: (itemId: string) => void;
}

export function RankedList({ items, onReorder, onUpdateItem, onRemoveItem }: RankedListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = useMemo(() => items.map((item) => item.id), [items]);
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
              rank={index + 1}
              onUpdate={(patch) => onUpdateItem(item.id, patch)}
              onRemove={() => onRemoveItem(item.id)}
            />
          ))}
        </ol>
      </SortableContext>

      <DragOverlay
        adjustScale
        modifiers={[lift]}
        dropAnimation={dropAnimation}
        style={{ transformOrigin: "0 0" }}
      >
        {activeItem ? <ItemCard item={activeItem} rank={rankOf(overId ?? activeItem.id)} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

interface SortableItemProps {
  item: Item;
  rank: number;
  onUpdate: (patch: ItemPatch) => void;
  onRemove: () => void;
}

function SortableItem({ item, rank, onUpdate, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }}>
      <ItemCard
        item={item}
        rank={rank}
        placeholder={isDragging}
        handleProps={{ ref: setActivatorNodeRef, ...attributes, ...listeners }}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />
    </li>
  );
}
