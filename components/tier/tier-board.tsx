"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  getFirstCollision,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  liftModifier,
  OVERLAY_STYLE,
  unliftedKeyboardCoordinates,
  useDropAnimation,
} from "@/components/list/drag-effects";
import { cn } from "@/lib/utils";
import { groupByTier, isTierZone, TIER_ZONES, UNRANKED, zoneOf, type TierZone } from "@/lib/tiers";
import { TIERS, type Item } from "@/types/list";
import { TierCard } from "./tier-card";
import { TIER_FILL } from "./tier-styles";

type ZoneIds = Record<TierZone, string[]>;

const LIFT_SCALE = 1.06;
const lift = liftModifier(LIFT_SCALE);
const keyboardCoordinates = unliftedKeyboardCoordinates(LIFT_SCALE);

const screenReaderInstructions = {
  draggable:
    "To move this item, press space or enter. Use the arrow keys to move between positions and tiers, then press space or enter to drop it, or escape to cancel.",
};

function zoneLabel(zone: TierZone | undefined): string {
  if (!zone) return "nowhere";
  return zone === UNRANKED ? "Unranked" : `${zone} tier`;
}

function idsByZone(items: readonly Item[]): ZoneIds {
  const groups = groupByTier(items);
  return Object.fromEntries(TIER_ZONES.map((zone) => [zone, groups[zone].map((item) => item.id)])) as ZoneIds;
}

interface TierBoardProps {
  items: Item[];
  onMove: (itemId: string, zone: TierZone, index: number) => void;
  onEditItem: (itemId: string) => void;
}

/**
 * The tier list: S to F rows plus an unranked pool, each a sortable container.
 * While dragging, cards move between containers in local state (so rows open
 * up live); the final zone and index are committed once on drop.
 */
export function TierBoard({ items, onMove, onEditItem }: TierBoardProps) {
  const [dragIds, setDragIds] = useState<ZoneIds | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedZone = useRef(false);
  const dropAnimation = useDropAnimation();

  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const committedIds = useMemo(() => idsByZone(items), [items]);
  const ids = dragIds ?? committedIds;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Press-and-hold on touch, so swiping over the board still scrolls the page.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates }),
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      recentlyMovedZone.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [ids]);

  const findZone = useCallback(
    (id: UniqueIdentifier): TierZone | undefined =>
      isTierZone(id) ? id : TIER_ZONES.find((zone) => ids[zone].includes(String(id))),
    [ids],
  );

  /**
   * Pointer first (precise for wrapping rows), then rectangle overlap. When
   * over a non-empty row, snap to the closest card in it. Right after a card
   * changes rows its layout is in flux, so hold the previous target for a frame
   * instead of flickering between rows.
   */
  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      const pointerHits = pointerWithin(args);
      const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args);
      let overId = getFirstCollision(hits, "id");

      if (overId != null) {
        if (isTierZone(overId) && ids[overId].length > 0) {
          const zoneIds = ids[overId];
          overId =
            closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter((container) =>
                zoneIds.includes(String(container.id)),
              ),
            })[0]?.id ?? overId;
        }
        lastOverId.current = overId;
        return [{ id: overId }];
      }

      if (recentlyMovedZone.current) lastOverId.current = activeId;
      return lastOverId.current != null ? [{ id: lastOverId.current }] : [];
    },
    [activeId, ids],
  );

  /** Where the active card lands if dropped now: its current zone, reordered onto `over` within it. */
  const placement = (activeKey: UniqueIdentifier, overKey: UniqueIdentifier | undefined) => {
    const itemId = String(activeKey);
    const zone = findZone(activeKey);
    if (!zone) return undefined;
    let zoneIds = ids[zone];
    if (overKey != null && !isTierZone(overKey) && findZone(overKey) === zone) {
      const from = zoneIds.indexOf(itemId);
      const to = zoneIds.indexOf(String(overKey));
      if (from !== to) zoneIds = arrayMove(zoneIds, from, to);
    }
    return { zone, index: zoneIds.indexOf(itemId) };
  };

  const titleOf = (id: UniqueIdentifier) => itemsById.get(String(id))?.title ?? "Item";

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)} from ${zoneLabel(findZone(active.id))}.`,
    onDragOver: ({ active, over }) =>
      over ? `${titleOf(active.id)} is over ${zoneLabel(findZone(over.id))}.` : undefined,
    onDragEnd: ({ active, over }) => {
      const target = over ? placement(active.id, over.id) : undefined;
      return target
        ? `${titleOf(active.id)} dropped in ${zoneLabel(target.zone)}, position ${target.index + 1}.`
        : `${titleOf(active.id)} dropped.`;
    },
    onDragCancel: ({ active }) => {
      const item = itemsById.get(String(active.id));
      return `Cancelled. ${titleOf(active.id)} stays in ${zoneLabel(item ? zoneOf(item) : undefined)}.`;
    },
  };

  function reset() {
    setDragIds(null);
    setActiveId(null);
    lastOverId.current = null;
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const from = findZone(active.id);
    const to = findZone(over.id);
    if (!from || !to || from === to) return;

    setDragIds((prev) => {
      const current = prev ?? committedIds;
      const target = [...current[to]];
      let index = isTierZone(over.id) ? target.length : target.indexOf(String(over.id));
      const dragged = active.rect.current.translated;
      if (!isTierZone(over.id) && dragged && dragged.left > over.rect.left + over.rect.width / 2) index += 1;
      target.splice(index < 0 ? target.length : index, 0, String(active.id));

      recentlyMovedZone.current = true;
      return { ...current, [from]: current[from].filter((id) => id !== active.id), [to]: target };
    });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const itemId = String(active.id);
    const target = over ? placement(active.id, over.id) : undefined;
    if (!target) return reset();
    const { zone, index } = target;

    const item = itemsById.get(itemId);
    const moved = !item || zoneOf(item) !== zone || committedIds[zone].indexOf(itemId) !== index;
    reset();
    if (moved) onMove(itemId, zone, index);
  }

  const activeItem = activeId ? itemsById.get(activeId) : undefined;
  const dragging = activeId !== null;

  const rowProps = (zone: TierZone) => ({
    zone,
    ids: ids[zone],
    itemsById,
    dragging,
    highlighted: dragging && activeId !== null && ids[zone].includes(activeId),
    onEditItem,
  });

  return (
    <DndContext
      id="tier-board"
      sensors={sensors}
      collisionDetection={collisionDetection}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={({ active }) => {
        setActiveId(String(active.id));
        setDragIds(committedIds);
      }}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={reset}
    >
      <div className="tier-board flex flex-col gap-2" data-dragging={dragging}>
        {TIERS.map((tier) => (
          <TierRow key={tier} {...rowProps(tier)} />
        ))}
        <TierRow {...rowProps(UNRANKED)} />
      </div>

      <DragOverlay adjustScale modifiers={[lift]} dropAnimation={dropAnimation} style={OVERLAY_STYLE}>
        {activeItem ? <TierCard item={activeItem} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

interface TierRowProps {
  zone: TierZone;
  ids: string[];
  itemsById: Map<string, Item>;
  dragging: boolean;
  highlighted: boolean;
  onEditItem: (itemId: string) => void;
}

function TierRow({ zone, ids, itemsById, dragging, highlighted, onEditItem }: TierRowProps) {
  const { setNodeRef } = useDroppable({ id: zone });
  const unranked = zone === UNRANKED;
  const label = unranked ? "Unranked" : `${zone} tier`;

  return (
    <section
      aria-label={`${label}, ${ids.length} ${ids.length === 1 ? "item" : "items"}`}
      className={cn(
        "overflow-hidden rounded-xl border transition-colors duration-150",
        unranked ? "mt-4 border-dashed border-border-strong bg-transparent" : "border-border bg-card",
        highlighted && "border-white/25",
      )}
    >
      {unranked && (
        <header className="flex items-baseline justify-between px-3 pt-3">
          <h2 className="text-sm font-semibold text-foreground">Unranked</h2>
          <span className="font-mono text-xs text-faint">{ids.length}</span>
        </header>
      )}

      <div className="flex">
        {!unranked && (
          <div
            className={cn(
              "flex w-12 shrink-0 items-center justify-center text-3xl font-black tracking-tight text-black sm:w-16 sm:text-4xl lg:w-20 lg:text-5xl",
              TIER_FILL[zone],
            )}
            aria-hidden
          >
            {zone}
          </div>
        )}

        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <ul
            ref={setNodeRef}
            className={cn(
              "flex min-h-28 min-w-0 flex-1 flex-wrap content-start gap-1.5 p-2 transition-colors duration-150 sm:min-h-32 sm:gap-2 lg:min-h-40 lg:gap-2.5 lg:p-2.5",
              highlighted && "bg-white/[0.04]",
            )}
          >
            {ids.map((id) => {
              const item = itemsById.get(id);
              return item ? <SortableTierCard key={id} item={item} onEdit={() => onEditItem(id)} /> : null;
            })}
            {ids.length === 0 && (
              <li
                aria-hidden
                className={cn(
                  "flex min-h-24 flex-1 items-center justify-center rounded-lg border border-dashed text-xs transition-colors sm:min-h-28 lg:min-h-36",
                  dragging ? "border-white/20 text-muted-foreground" : "border-border text-faint",
                )}
              >
                {unranked && !dragging ? "New items land here" : "Drop here"}
              </li>
            )}
          </ul>
        </SortableContext>
      </div>
    </section>
  );
}

function SortableTierCard({ item, onEdit }: { item: Item; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-label={item.title}
      className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <TierCard item={item} placeholder={isDragging} onEdit={onEdit} />
    </li>
  );
}
