import type { List } from "@/types/list";
import { migrateList, type StoredList } from "./migrations";
import type { StorageAdapter } from "./types";

export const DEFAULT_STORAGE_KEY = "rankd:v1";

interface Snapshot {
  version: 1;
  /** Which seed revision this data has seen. Absent on data from before seed versioning (= 1). */
  seedVersion?: number;
  lists: List[];
}

export interface LocalStorageAdapterOptions {
  /** localStorage key that holds every list. */
  key?: string;
  /** Lists written the first time the key is empty. */
  seed?: () => List[];
  /** Current seed revision. Stored data with an older revision is passed through `backfill` once. */
  seedVersion?: number;
  /** Upgrades lists written under an older seed revision. */
  backfill?: (lists: List[]) => List[];
}

/**
 * Browser-only adapter that keeps every list in a single localStorage key as a
 * versioned JSON snapshot.
 */
export class LocalStorageAdapter implements StorageAdapter {
  private readonly key: string;
  private readonly seed?: () => List[];
  private readonly seedVersion: number;
  private readonly backfill?: (lists: List[]) => List[];

  constructor(options: LocalStorageAdapterOptions = {}) {
    this.key = options.key ?? DEFAULT_STORAGE_KEY;
    this.seed = options.seed;
    this.seedVersion = options.seedVersion ?? 1;
    this.backfill = options.backfill;
  }

  async getLists(): Promise<List[]> {
    return this.read().lists;
  }

  async getList(id: string): Promise<List | null> {
    return this.read().lists.find((list) => list.id === id) ?? null;
  }

  async saveList(list: List): Promise<List> {
    const snapshot = this.read();
    const index = snapshot.lists.findIndex((existing) => existing.id === list.id);
    if (index === -1) snapshot.lists.push(list);
    else snapshot.lists[index] = list;
    this.write(snapshot);
    return list;
  }

  async deleteList(id: string): Promise<void> {
    const snapshot = this.read();
    this.write({ ...snapshot, lists: snapshot.lists.filter((list) => list.id !== id) });
  }

  private get storage(): Storage {
    if (typeof window === "undefined") {
      throw new Error("LocalStorageAdapter can only be used in the browser.");
    }
    return window.localStorage;
  }

  private read(): Snapshot {
    const raw = this.storage.getItem(this.key);

    if (raw === null) {
      const snapshot: Snapshot = { version: 1, seedVersion: this.seedVersion, lists: this.seed?.() ?? [] };
      this.write(snapshot);
      return snapshot;
    }

    let parsed: Partial<Snapshot> | null = null;
    try {
      parsed = JSON.parse(raw) as Partial<Snapshot>;
    } catch {
      // Fall through to the error below.
    }

    if (parsed?.version === 1 && Array.isArray(parsed.lists)) {
      const stored = parsed.lists as StoredList[];
      let lists = stored.map(migrateList);
      let changed = lists.some((list, index) => list !== stored[index]);

      const seedVersion = parsed.seedVersion ?? 1;
      if (seedVersion < this.seedVersion && this.backfill) {
        lists = this.backfill(lists);
        changed = true;
      }

      const snapshot: Snapshot = { version: 1, seedVersion: Math.max(seedVersion, this.seedVersion), lists };
      if (changed || seedVersion !== snapshot.seedVersion) this.write(snapshot);
      return snapshot;
    }
    throw new Error(`Stored data under "${this.key}" is unreadable. Clear it in devtools to start fresh.`);
  }

  private write(snapshot: Snapshot): void {
    this.storage.setItem(this.key, JSON.stringify(snapshot));
  }
}
