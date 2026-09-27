import { createId, now } from "@/lib/id";
import { moveItem, patchItem, removeItem } from "@/lib/ranking";
import { createSource, type ItemSource } from "@/lib/sources";
import { getStorage, type StorageAdapter } from "@/lib/storage";
import { cleanItemPatch, cleanOptional } from "@/lib/text";
import { applyTiers, defaultTiers, moveToTier, type TierZone } from "@/lib/tiers";
import {
  RANKING_MODES,
  type Item,
  type ItemPatch,
  type List,
  type ListPatch,
  type NewItem,
  type NewList,
  type TierDef,
} from "@/types/list";

/**
 * The ranking engine's public API. UI code talks to this service; it
 * coordinates the storage adapter (persistence) and item sources (ingestion).
 */
export class ListService {
  constructor(private readonly storage: StorageAdapter) {}

  /** All lists, most recently updated first. */
  async getLists(): Promise<List[]> {
    const lists = await this.storage.getLists();
    return lists.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  /** A list with its items resolved through the list's source. */
  async getList(id: string): Promise<List | null> {
    const list = await this.storage.getList(id);
    if (!list) return null;
    return { ...list, items: await this.sourceFor(list).getItems() };
  }

  async createList(input: NewList): Promise<List> {
    const title = input.title.trim();
    if (!title) throw new Error("List title is required.");
    const timestamp = now();
    return this.storage.saveList({
      id: createId(),
      title,
      description: cleanOptional(input.description),
      itemSourceType: input.itemSourceType ?? "manual",
      rankingMode: input.rankingMode ?? "tier",
      tiers: defaultTiers(),
      createdAt: timestamp,
      updatedAt: timestamp,
      items: [],
    });
  }

  async updateList(id: string, patch: ListPatch): Promise<List> {
    const list = await this.requireList(id);
    const next: List = { ...list };
    if ("title" in patch) {
      const title = patch.title?.trim();
      if (!title) throw new Error("List title is required.");
      next.title = title;
    }
    if ("description" in patch) next.description = cleanOptional(patch.description);
    if (patch.rankingMode !== undefined) {
      if (!RANKING_MODES.includes(patch.rankingMode))
        throw new Error(`Unknown ranking mode "${patch.rankingMode}".`);
      next.rankingMode = patch.rankingMode;
    }
    return this.commit(next);
  }

  /** Saves a whole list as-is (ids, ranks, tiers, timestamps), replacing any list with the same id. */
  async importList(list: List): Promise<List> {
    return this.storage.saveList(list);
  }

  async deleteList(id: string): Promise<void> {
    await this.storage.deleteList(id);
  }

  async addItem(listId: string, input: NewItem): Promise<Item> {
    const list = await this.requireList(listId);
    return this.sourceFor(list).addItem(input);
  }

  async updateItem(listId: string, itemId: string, patch: ItemPatch): Promise<List> {
    const list = await this.requireList(listId);
    return this.commit({ ...list, items: patchItem(list.items, itemId, cleanItemPatch(patch)) });
  }

  async removeItem(listId: string, itemId: string): Promise<List> {
    const list = await this.requireList(listId);
    return this.commit({ ...list, items: removeItem(list.items, itemId) });
  }

  /** Moves `activeId` into the rank currently held by `overId`. */
  async reorderItems(listId: string, activeId: string, overId: string): Promise<List> {
    const list = await this.requireList(listId);
    return this.commit({ ...list, items: moveItem(list.items, activeId, overId) });
  }

  /** Places an item in a tier (or the unranked pool) at `index` within that zone. */
  async moveItemToTier(listId: string, itemId: string, zone: TierZone, index: number): Promise<List> {
    const list = await this.requireList(listId);
    return this.commit({ ...list, items: moveToTier(list.items, list.tiers, itemId, zone, index) });
  }

  /** Replaces the tier rows. Items in a removed tier fall to the unranked pool. */
  async setTiers(listId: string, tiers: TierDef[]): Promise<List> {
    if (tiers.length === 0) throw new Error("A list needs at least one tier.");
    const list = await this.requireList(listId);
    return this.commit({ ...list, tiers, items: applyTiers(list.items, tiers) });
  }

  private sourceFor(list: List): ItemSource {
    return createSource(list.itemSourceType, { listId: list.id, storage: this.storage });
  }

  private async requireList(id: string): Promise<List> {
    const list = await this.storage.getList(id);
    if (!list) throw new Error(`List ${id} not found.`);
    return list;
  }

  private commit(list: List): Promise<List> {
    return this.storage.saveList({ ...list, updatedAt: now() });
  }
}

let service: ListService | null = null;

export function getListService(): ListService {
  service ??= new ListService(getStorage());
  return service;
}
