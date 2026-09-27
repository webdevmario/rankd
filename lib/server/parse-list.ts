import "server-only";
import { normalizeRanks } from "@/lib/ranking";
import { ITEM_SOURCE_TYPES, RANKING_MODES, TIERS, type Item, type List } from "@/types/list";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class InvalidListError extends Error {}

/** Checks a list sent by the client before it's written. Throws `InvalidListError` on bad input. */
export function parseList(input: unknown): List {
  const value = record(input, "list");
  const items = value.items;
  if (!Array.isArray(items)) throw new InvalidListError("items must be an array.");

  const list: List = {
    id: uuid(value.id, "id"),
    title: requiredText(value.title, "title"),
    itemSourceType: oneOf(value.itemSourceType, ITEM_SOURCE_TYPES, "itemSourceType"),
    rankingMode: oneOf(value.rankingMode, RANKING_MODES, "rankingMode"),
    createdAt: timestamp(value.createdAt, "createdAt"),
    updatedAt: timestamp(value.updatedAt, "updatedAt"),
    // Ranks are repaired rather than rejected, so a stale client can't break contiguity.
    items: normalizeRanks(items.map(parseItem)),
  };
  const description = optionalText(value.description, "description");
  if (description) list.description = description;
  return list;
}

function parseItem(input: unknown, index: number): Item {
  const value = record(input, `items[${index}]`);
  const item: Item = {
    id: uuid(value.id, `items[${index}].id`),
    title: requiredText(value.title, `items[${index}].title`),
    rank: typeof value.rank === "number" && Number.isInteger(value.rank) ? value.rank : index + 1,
  };
  const description = optionalText(value.description, `items[${index}].description`);
  const coverImageUrl = optionalText(value.coverImageUrl, `items[${index}].coverImageUrl`);
  const notes = optionalText(value.notes, `items[${index}].notes`);
  if (description) item.description = description;
  if (coverImageUrl) item.coverImageUrl = coverImageUrl;
  if (notes) item.notes = notes;
  if (value.tier !== undefined && value.tier !== null)
    item.tier = oneOf(value.tier, TIERS, `items[${index}].tier`);
  return item;
}

function record(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvalidListError(`${name} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function uuid(value: unknown, name: string): string {
  if (typeof value !== "string" || !UUID.test(value)) throw new InvalidListError(`${name} must be a UUID.`);
  return value;
}

function requiredText(value: unknown, name: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new InvalidListError(`${name} is required.`);
  return text;
}

function optionalText(value: unknown, name: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new InvalidListError(`${name} must be a string.`);
  return value.trim() || undefined;
}

function oneOf<T extends string>(value: unknown, options: readonly T[], name: string): T {
  if (typeof value !== "string" || !(options as readonly string[]).includes(value)) {
    throw new InvalidListError(`${name} must be one of ${options.join(", ")}.`);
  }
  return value as T;
}

function timestamp(value: unknown, name: string): string {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new InvalidListError(`${name} must be an ISO timestamp.`);
  }
  return new Date(value).toISOString();
}
