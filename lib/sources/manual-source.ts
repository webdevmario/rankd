import { createId, now } from "@/lib/id";
import { appendItem, sortByRank } from "@/lib/ranking";
import { cleanItemInput } from "@/lib/text";
import type { Item, List, NewItem } from "@/types/list";
import type { ItemSource, SourceContext } from "./types";

/** Items typed in by the user and stored alongside the list. */
export class ManualSource implements ItemSource {
  readonly type = "manual" as const;

  constructor(private readonly context: SourceContext) {}

  async getItems(): Promise<Item[]> {
    const list = await this.requireList();
    return sortByRank(list.items);
  }

  async addItem(input: NewItem): Promise<Item> {
    const list = await this.requireList();
    const items = appendItem(list.items, { id: createId(), rank: 0, ...cleanItemInput(input) });
    await this.context.storage.saveList({ ...list, items, updatedAt: now() });
    return items[items.length - 1];
  }

  private async requireList(): Promise<List> {
    const list = await this.context.storage.getList(this.context.listId);
    if (!list) throw new Error(`List ${this.context.listId} not found.`);
    return list;
  }
}
