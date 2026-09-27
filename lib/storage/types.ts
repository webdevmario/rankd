import type { List } from "@/types/list";

/**
 * Persistence boundary for the ranking engine.
 *
 * Adapters store whole List documents (items embedded). Everything above this
 * layer is async, so a network-backed adapter (Postgres, Supabase, …) can
 * implement the same four methods without touching the UI.
 */
export interface StorageAdapter {
  getLists(): Promise<List[]>;
  getList(id: string): Promise<List | null>;
  /** Inserts or replaces the list with the same id. */
  saveList(list: List): Promise<List>;
  deleteList(id: string): Promise<void>;
}
