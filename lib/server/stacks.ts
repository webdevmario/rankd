import "server-only";
import { stacksBookId, stacksCoverPath, type StacksBook } from "@/lib/stacks-ref";
import type { List } from "@/types/list";

/**
 * rankd's read-only client for Stacks (the household book log, the master
 * record for books). It only uses Stacks's HTTP routes, never its database.
 *
 *   STACKS_URL         default http://localhost:3002
 *   STACKS_PROFILE_ID  whose shelf "Add a book" searches, default 1 (Mario)
 */
export const STACKS_URL = (process.env.STACKS_URL ?? "http://localhost:3002").replace(/\/$/, "");
const PROFILE_ID = Number(process.env.STACKS_PROFILE_ID ?? 1);
const TIMEOUT_MS = 2000;

interface LinkedBook {
  id: number;
  title: string;
  author: string | null;
  coverVersion: string | null;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${STACKS_URL}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Stacks ${path} answered ${response.status}.`);
  return (await response.json()) as T;
}

function toStacksBook(book: LinkedBook): StacksBook {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    coverUrl: book.coverVersion ? stacksCoverPath(book.id, book.coverVersion) : null,
  };
}

/** Books on your Stacks shelf matching `q` (most recently read first when `q` is empty). */
export async function searchStacksShelf(q: string, limit = 20): Promise<StacksBook[]> {
  const params = new URLSearchParams({ profileId: String(PROFILE_ID), limit: String(limit) });
  if (q.trim()) params.set("q", q.trim());
  const { books } = await getJson<{ books: LinkedBook[] }>(`/api/library/search?${params}`);
  return books.map(toStacksBook);
}

/** The Stacks books with these ids, by id. Ids Stacks doesn't have are left out. */
export async function getStacksBooks(ids: number[]): Promise<Map<number, StacksBook>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const { books } = await getJson<{ books: LinkedBook[] }>(`/api/library/books?ids=${unique.join(",")}`);
  return new Map(books.map((book) => [book.id, toStacksBook(book)]));
}

/**
 * Fills in linked items' title, author and cover from Stacks. If Stacks can't
 * be reached, linked items keep their stored title and point at the cover
 * proxy, which shows the cover again once Stacks is back.
 */
export async function withStacksBooks(lists: List[]): Promise<List[]> {
  const ids = lists.flatMap((list) =>
    list.items.flatMap((item) => {
      const id = stacksBookId(item.sourceRef);
      return id === null ? [] : [id];
    }),
  );
  if (ids.length === 0) return lists;

  let books = new Map<number, StacksBook>();
  try {
    books = await getStacksBooks(ids);
  } catch (error) {
    console.error("Couldn't read linked books from Stacks", error);
  }

  return lists.map((list) => ({
    ...list,
    items: list.items.map((item) => {
      const id = stacksBookId(item.sourceRef);
      if (id === null) return item;
      const book = books.get(id);
      if (!book) return { ...item, coverImageUrl: stacksCoverPath(id) };
      const linked = { ...item, title: book.title };
      if (book.author) linked.author = book.author;
      if (book.coverUrl) linked.coverImageUrl = book.coverUrl;
      else delete linked.coverImageUrl;
      return linked;
    }),
  }));
}
