import type { List } from "@/types/list";
import type { StorageAdapter } from "./types";

export class StorageRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * Stores lists in Postgres through the app's own API (`app/api/lists`), so
 * every device sees the same data.
 */
export class HttpStorageAdapter implements StorageAdapter {
  constructor(private readonly base = "/api/lists") {}

  async getLists(): Promise<List[]> {
    return this.request<List[]>(this.base);
  }

  async getList(id: string): Promise<List | null> {
    try {
      return await this.request<List>(this.url(id));
    } catch (error) {
      if (error instanceof StorageRequestError && error.status === 404) return null;
      throw error;
    }
  }

  async saveList(list: List): Promise<List> {
    return this.request<List>(this.url(list.id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(list),
    });
  }

  async deleteList(id: string): Promise<void> {
    await this.request<null>(this.url(id), { method: "DELETE" });
  }

  private url(id: string): string {
    return `${this.base}/${encodeURIComponent(id)}`;
  }

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, { cache: "no-store", ...init });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new StorageRequestError(body?.error ?? `Request failed (${response.status}).`, response.status);
    }
    return (response.status === 204 ? null : await response.json()) as T;
  }
}
