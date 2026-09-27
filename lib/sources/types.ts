import type { StorageAdapter } from "@/lib/storage";
import type { Item, ItemSourceType, NewItem } from "@/types/list";

/**
 * Where a list's items come from.
 *
 * `ManualSource` reads and writes items the user typed in. Future adapters
 * (Stack API, CSV import, Goodreads, TMDB, …) implement the same contract,
 * e.g. `getItems` pulling from a remote catalogue and `addItem` importing a
 * picked result into the list.
 */
export interface ItemSource {
  readonly type: ItemSourceType;
  /** Items in rank order. */
  getItems(): Promise<Item[]>;
  /** Adds an item at the bottom of the ranking and returns it with id and rank assigned. */
  addItem(item: NewItem): Promise<Item>;
}

export interface SourceContext {
  listId: string;
  storage: StorageAdapter;
}

export type SourceFactory = (context: SourceContext) => ItemSource;
