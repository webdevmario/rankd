/**
 * Links between rankd items and Stacks books. Shared by the server and the
 * browser: no Stacks URL lives here, only rankd's own proxy paths.
 */

const REF = /^stacks:book:([1-9][0-9]*)$/;

export function stacksBookRef(bookId: number): string {
  return `stacks:book:${bookId}`;
}

/** The Stacks book id in a source ref, or null when the ref isn't a Stacks book. */
export function stacksBookId(ref: string | undefined): number | null {
  const match = ref?.match(REF);
  return match ? Number(match[1]) : null;
}

/**
 * rankd's proxy for a Stacks book's cover. `version` changes whenever the
 * cover does, so the browser can keep each version for good.
 */
export function stacksCoverPath(bookId: number, version?: string | null): string {
  return `/api/stacks/books/${bookId}/cover${version ? `?v=${encodeURIComponent(version)}` : ""}`;
}

/** A book on your Stacks shelf, as rankd's search returns it. */
export interface StacksBook {
  id: number;
  title: string;
  author: string | null;
  /** rankd's proxy path for the cover, or null when the book has none. */
  coverUrl: string | null;
}
