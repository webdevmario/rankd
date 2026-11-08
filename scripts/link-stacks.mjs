#!/usr/bin/env node
/**
 * One-off: turn a list into a Books list and link its items to the books on
 * your Stacks shelf, matched by title. Linked items then show Stacks's title,
 * author and cover. Dry run by default; nothing is written without --apply.
 *
 *   npm run link:stacks -- "Stephen King"            # show the matches
 *   npm run link:stacks -- "Stephen King" --apply    # write them
 *
 * Reads rankd's DATABASE_URL (.env.local) and Stacks over HTTP (STACKS_URL,
 * default http://localhost:3002; STACKS_PROFILE_ID, default 1). Items already
 * linked are left alone; items with no confident match stay free text.
 */
import pg from "pg";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const listName = args.find((arg) => !arg.startsWith("--"));
const STACKS_URL = (process.env.STACKS_URL ?? "http://localhost:3002").replace(/\/$/, "");
const PROFILE_ID = Number(process.env.STACKS_PROFILE_ID ?? 1);

if (!listName) {
  console.error('Usage: npm run link:stacks -- "<list title or id>" [--apply]');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local.");
  process.exit(1);
}

/** Lowercase words only, with a trailing "(Series #1)" dropped. */
function normalize(title) {
  return title
    .toLowerCase()
    .replace(/\([^)]*\)\s*$/, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** "It" matches "It: A Novel"; "Carrie" doesn't match "Carrie Soto Is Back". */
function sameBook(itemTitle, bookTitle) {
  const a = normalize(itemTitle);
  const b = normalize(bookTitle);
  if (a === b) return true;
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  return /^(a novel|the novel)$/.test(longer.slice(shorter.length).trim());
}

async function searchShelf(q) {
  const params = new URLSearchParams({ profileId: String(PROFILE_ID), q, limit: "5" });
  const response = await fetch(`${STACKS_URL}/api/library/search?${params}`);
  if (!response.ok) throw new Error(`Stacks search answered ${response.status}. Is the new Stacks deployed?`);
  return (await response.json()).books;
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const { rows: lists } = await client.query(
    "select id, title, kind from lists where id::text = $1 or lower(title) = lower($1)",
    [listName],
  );
  if (lists.length !== 1) throw new Error(`Expected one list called "${listName}", found ${lists.length}.`);
  const list = lists[0];
  const { rows: items } = await client.query(
    "select id, title, source_ref from items where list_id = $1 order by rank",
    [list.id],
  );

  const links = [];
  for (const item of items) {
    if (item.source_ref) {
      console.log(`  already linked  ${item.title} -> ${item.source_ref}`);
      continue;
    }
    const book = (await searchShelf(normalize(item.title))).find((b) => sameBook(item.title, b.title));
    if (book) {
      links.push({ item, book });
      console.log(`  link            ${item.title} -> Stacks #${book.id} "${book.title}"`);
    } else {
      console.log(`  no match        ${item.title} (stays free text)`);
    }
  }

  console.log(
    `\n${list.title}: ${links.length} of ${items.length} items to link; list kind becomes "books".`,
  );
  if (!apply) {
    console.log("Dry run. Add --apply to write.");
  } else {
    await client.query("begin");
    await client.query("update lists set kind = 'books' where id = $1", [list.id]);
    for (const { item, book } of links) {
      await client.query("update items set source_ref = $2, cover_image_url = null where id = $1", [
        item.id,
        `stacks:book:${book.id}`,
      ]);
    }
    await client.query("commit");
    console.log("Written.");
  }
} catch (error) {
  await client.query("rollback").catch(() => {});
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
