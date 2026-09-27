#!/usr/bin/env node
/**
 * Applies db/migrations/*.sql in filename order, each once, each in its own
 * transaction. Applied files are recorded in `schema_migrations`.
 *
 *   npm run db:migrate      # reads DATABASE_URL from .env.local
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  await client.query(
    "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const { rows } = await client.query("select name from schema_migrations");
  const applied = new Set(rows.map((row) => row.name));
  const files = (await readdir(DIR)).filter((file) => file.endsWith(".sql")).sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(DIR, file), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into schema_migrations (name) values ($1)", [file]);
      await client.query("commit");
      console.log(`Applied ${file}`);
      count += 1;
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
  console.log(count === 0 ? "Database is up to date." : `Applied ${count} migration(s).`);
} finally {
  await client.end();
}
