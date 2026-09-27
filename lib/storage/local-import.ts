import type { List } from "@/types/list";
import { migrateList, type StoredList } from "./migrations";

/**
 * Before Postgres, each browser kept its lists in localStorage under this key
 * (`{ version: 1, lists: [...] }`). These helpers read that data once so it
 * can be imported into the database, then remember the browser is done.
 */
export const LOCAL_KEY = "rankd:v1";
const HANDLED_KEY = "rankd:v1:handled";

/** Lists this browser saved locally and hasn't imported or skipped yet, brought up to the current schema. */
export function readLocalLists(): List[] {
  try {
    if (localStorage.getItem(HANDLED_KEY)) return [];
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { version?: number; lists?: StoredList[] };
    if (parsed.version !== 1 || !Array.isArray(parsed.lists)) return [];
    return parsed.lists.map(migrateList);
  } catch (error) {
    console.error(error);
    return [];
  }
}

/**
 * Stops offering the import in this browser. The local copy stays in
 * localStorage untouched, so nothing is lost if it's needed later.
 */
export function markLocalListsHandled(): void {
  try {
    localStorage.setItem(HANDLED_KEY, new Date().toISOString());
  } catch (error) {
    console.error(error);
  }
}
