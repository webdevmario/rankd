import "server-only";
import type { Item, ItemSourceType, List, RankingMode, TierDef } from "@/types/list";
import { getPool, transaction } from "./db";

interface ListRow {
  id: string;
  title: string;
  description: string | null;
  item_source_type: ItemSourceType;
  ranking_mode: RankingMode;
  tiers: TierDef[];
  created_at: Date;
  updated_at: Date;
}

interface ItemRow {
  id: string;
  list_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  notes: string | null;
  rank: number;
  tier: string | null;
}

const LIST_COLUMNS = "id, title, description, item_source_type, ranking_mode, tiers, created_at, updated_at";
const ITEM_COLUMNS = "id, list_id, title, description, cover_image_url, notes, rank, tier";

/** Every list with its items, most recently updated first. */
export async function findLists(): Promise<List[]> {
  const pool = getPool();
  const [lists, items] = await Promise.all([
    pool.query<ListRow>(`select ${LIST_COLUMNS} from lists order by updated_at desc`),
    pool.query<ItemRow>(`select ${ITEM_COLUMNS} from items order by list_id, rank`),
  ]);
  const byList = new Map<string, Item[]>();
  for (const row of items.rows) {
    const bucket = byList.get(row.list_id) ?? [];
    bucket.push(toItem(row));
    byList.set(row.list_id, bucket);
  }
  return lists.rows.map((row) => toList(row, byList.get(row.id) ?? []));
}

export async function findList(id: string): Promise<List | null> {
  const pool = getPool();
  const [lists, items] = await Promise.all([
    pool.query<ListRow>(`select ${LIST_COLUMNS} from lists where id = $1`, [id]),
    pool.query<ItemRow>(`select ${ITEM_COLUMNS} from items where list_id = $1 order by rank`, [id]),
  ]);
  const row = lists.rows[0];
  return row ? toList(row, items.rows.map(toItem)) : null;
}

/** Inserts or replaces a list and all of its items in one transaction. */
export async function upsertList(list: List): Promise<List> {
  await transaction(async (client) => {
    await client.query(
      `insert into lists (${LIST_COLUMNS}) values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
       on conflict (id) do update set
         title = excluded.title,
         description = excluded.description,
         item_source_type = excluded.item_source_type,
         ranking_mode = excluded.ranking_mode,
         tiers = excluded.tiers,
         updated_at = excluded.updated_at`,
      [
        list.id,
        list.title,
        list.description ?? null,
        list.itemSourceType,
        list.rankingMode,
        JSON.stringify(list.tiers),
        list.createdAt,
        list.updatedAt,
      ],
    );
    await client.query("delete from items where list_id = $1", [list.id]);
    if (list.items.length > 0) {
      // One multi-row insert: ($1..$8), ($9..$16), ...
      const values: unknown[] = [];
      const tuples = list.items.map((item, index) => {
        values.push(
          item.id,
          list.id,
          item.title,
          item.description ?? null,
          item.coverImageUrl ?? null,
          item.notes ?? null,
          item.rank,
          item.tier ?? null,
        );
        const base = index * 8;
        return `(${Array.from({ length: 8 }, (_, i) => `$${base + i + 1}`).join(", ")})`;
      });
      await client.query(`insert into items (${ITEM_COLUMNS}) values ${tuples.join(", ")}`, values);
    }
  });
  return list;
}

export async function removeList(id: string): Promise<void> {
  await getPool().query("delete from lists where id = $1", [id]);
}

function toList(row: ListRow, items: Item[]): List {
  return {
    id: row.id,
    title: row.title,
    ...(row.description ? { description: row.description } : {}),
    itemSourceType: row.item_source_type,
    rankingMode: row.ranking_mode,
    tiers: row.tiers,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    items,
  };
}

function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    title: row.title,
    ...(row.description ? { description: row.description } : {}),
    ...(row.cover_image_url ? { coverImageUrl: row.cover_image_url } : {}),
    ...(row.notes ? { notes: row.notes } : {}),
    rank: row.rank,
    ...(row.tier ? { tier: row.tier } : {}),
  };
}
