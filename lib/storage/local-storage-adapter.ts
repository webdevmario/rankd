import type { List } from "@/types/list";
import type { StorageAdapter } from "./types";

export const DEFAULT_STORAGE_KEY = "rankd:v1";

interface Snapshot {
  version: 1;
  lists: List[];
}

export interface LocalStorageAdapterOptions {
  /** localStorage key that holds every list. */
  key?: string;
  /** Lists written the first time the key is empty. */
  seed?: () => List[];
}

/**
 * Browser-only adapter that keeps every list in a single localStorage key as a
 * versioned JSON snapshot.
 */
export class LocalStorageAdapter implements StorageAdapter {
  private readonly key: string;
  private readonly seed?: () => List[];

  constructor(options: LocalStorageAdapterOptions = {}) {
    this.key = options.key ?? DEFAULT_STORAGE_KEY;
    this.seed = options.seed;
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
      const snapshot: Snapshot = { version: 1, lists: this.seed?.() ?? [] };
      this.write(snapshot);
      return snapshot;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<Snapshot>;
      if (parsed.version === 1 && Array.isArray(parsed.lists)) {
        return { version: 1, lists: parsed.lists };
      }
    } catch {
      // Fall through to the error below.
    }
    throw new Error(`Stored data under "${this.key}" is unreadable. Clear it in devtools to start fresh.`);
  }

  private write(snapshot: Snapshot): void {
    this.storage.setItem(this.key, JSON.stringify(snapshot));
  }
}
