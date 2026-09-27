import { StorageRequestError } from "@/lib/storage/http-storage-adapter";
import type { ItemPatch, NewItem } from "@/types/list";

/** Trims a string and collapses empty values to `undefined` so they drop out of JSON. */
export function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function cleanItemInput(input: NewItem): NewItem {
  const title = input.title.trim();
  if (!title) throw new Error("Item title is required.");
  return {
    title,
    description: cleanOptional(input.description),
    coverImageUrl: cleanOptional(input.coverImageUrl),
    notes: cleanOptional(input.notes),
  };
}

export function cleanItemPatch(patch: ItemPatch): ItemPatch {
  const cleaned: ItemPatch = {};
  if ("title" in patch) {
    const title = patch.title?.trim();
    if (!title) throw new Error("Item title is required.");
    cleaned.title = title;
  }
  if ("description" in patch) cleaned.description = cleanOptional(patch.description);
  if ("coverImageUrl" in patch) cleaned.coverImageUrl = cleanOptional(patch.coverImageUrl);
  if ("notes" in patch) cleaned.notes = cleanOptional(patch.notes);
  return cleaned;
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** A cover the app can show: a web URL, or a photo uploaded from the device (stored as a data URL). */
export function isCoverSrc(value: string): boolean {
  return isHttpUrl(value) || value.startsWith("data:image/");
}

/** A readable message for a failed save: the API's reason when it rejected the data, otherwise `fallback`. */
export function saveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof StorageRequestError && error.status >= 400 && error.status < 500) return error.message;
  return fallback;
}
