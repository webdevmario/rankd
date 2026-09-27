import { LocalStorageAdapter } from "./local-storage-adapter";
import { backfillSeed, SEED_VERSION, seedLists } from "./seed";
import type { StorageAdapter } from "./types";

export type { StorageAdapter } from "./types";
export { LocalStorageAdapter, DEFAULT_STORAGE_KEY } from "./local-storage-adapter";

let adapter: StorageAdapter | null = null;

/**
 * The app-wide storage adapter. Swap the implementation here to move from
 * localStorage to a hosted backend.
 */
export function getStorage(): StorageAdapter {
  adapter ??= new LocalStorageAdapter({ seed: seedLists, seedVersion: SEED_VERSION, backfill: backfillSeed });
  return adapter;
}
