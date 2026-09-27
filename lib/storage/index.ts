import { HttpStorageAdapter } from "./http-storage-adapter";
import type { StorageAdapter } from "./types";

export type { StorageAdapter } from "./types";
export { HttpStorageAdapter, StorageRequestError } from "./http-storage-adapter";
export { LOCAL_KEY, markLocalListsHandled, readLocalLists } from "./local-import";

let adapter: StorageAdapter | null = null;

/**
 * The app-wide storage adapter: Postgres, through the app's API. Lists a
 * browser saved locally before the database existed are imported once (see
 * `lib/storage/local-import.ts` and `components/lists/local-import-banner.tsx`).
 */
export function getStorage(): StorageAdapter {
  adapter ??= new HttpStorageAdapter();
  return adapter;
}
