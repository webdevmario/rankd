#!/usr/bin/env node
/**
 * One-time import: reads a profile's Stephen King reads from the Stacks
 * Postgres database and writes them to data/king-books.json, which seeds the
 * "Stephen King — Recently Read" list.
 *
 *   npm run import:stacks
 *
 * Connection: STACKS_DATABASE_URL, else DATABASE_URL (the npm script loads
 * ../stacks/.env). The query runs in a read-only transaction.
 *
 * Initial order follows the list's own description, "worst to best (favorite
 * last)": ascending Stacks rating, ties broken by read date (earliest first).
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const PROFILE = process.env.STACKS_PROFILE ?? "Mario";
const AUTHOR = "Stephen King";
const OUT = fileURLToPath(new URL("../data/king-books.json", import.meta.url));
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const connectionString = process.env.STACKS_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set STACKS_DATABASE_URL (or run via `npm run import:stacks`, which loads ../stacks/.env).");
  process.exit(1);
}

const client = new pg.Client({ connectionString });
await client.connect();

try {
  await client.query("BEGIN READ ONLY");
  const { rows } = await client.query(
    `select l.id as log_id, b.id as book_id, b.title, b.cover_url,
            l.rating, l.favorite, l.read_month, l.read_year
       from reading_logs l
       join books b on b.id = l.book_id
       join profiles p on p.id = l.profile_id
      where p.name = $1 and b.author ilike $2
      order by l.rating asc nulls first, l.read_year asc, l.read_month asc, l.id asc`,
    [PROFILE, `%${AUTHOR}%`],
  );
  await client.query("COMMIT");

  if (rows.length === 0) {
    console.error(`No ${AUTHOR} reads found for profile "${PROFILE}".`);
    process.exit(1);
  }

  const items = rows.map((row) => {
    const read = `Read ${MONTHS[row.read_month - 1]} ${row.read_year}`;
    const rating = row.rating != null ? ` · ${row.rating}/10 in Stacks` : "";
    return {
      title: row.title,
      description: `${read}${rating}`,
      ...(row.cover_url ? { coverImageUrl: row.cover_url } : {}),
      stacks: {
        logId: row.log_id,
        bookId: row.book_id,
        rating: row.rating,
        favorite: row.favorite,
        readMonth: row.read_month,
        readYear: row.read_year,
      },
    };
  });

  const payload = {
    source: "stacks",
    profile: PROFILE,
    author: AUTHOR,
    importedAt: new Date().toISOString(),
    items,
  };
  await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${items.length} items to data/king-books.json:`);
  items.forEach((item, i) => console.log(`  ${i + 1}. ${item.title} — ${item.description}`));
} finally {
  await client.end();
}
