import "server-only";
import { Pool, type PoolClient } from "pg";

declare global {
  // Reused across dev hot reloads so each reload doesn't open a new pool.
  var rankdPool: Pool | undefined;
}

export function getPool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set. Add it to .env.local.");
  globalThis.rankdPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return globalThis.rankdPool;
}

export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const result = await work(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
