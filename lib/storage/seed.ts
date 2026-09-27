import { createId, now } from "@/lib/id";
import type { List } from "@/types/list";

/** Lists created on first run. */
export function seedLists(): List[] {
  const timestamp = now();
  return [
    {
      id: createId(),
      title: "Stephen King — Recently Read",
      description: "Ranking my most recent reads, worst to best (well, favorite last).",
      itemSourceType: "manual",
      createdAt: timestamp,
      updatedAt: timestamp,
      items: [],
    },
  ];
}
