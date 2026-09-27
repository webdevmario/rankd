# rankd

A personal ranking engine. Make a list, add things, then drag them into the order they deserve.

The first list is **Stephen King — Recently Read**, but nothing in the app is specific to books. rankd is
built as a small, reusable engine: lists and ranks are generic, where data is _stored_ is behind one
interface, and where items _come from_ is behind another.

## The ranking engine

Every ranking is a `List` of `Item`s. Each item has a 1-based `rank`, and ranks are always contiguous
(1, 2, 3, …). The engine does three jobs:

1. **Rank.** Pure functions in `lib/ranking.ts` (`moveItem`, `appendItem`, `removeItem`, …) take items and
   return a new, re-ranked array. The UI applies them optimistically, so drag-and-drop never flickers, and
   the service applies the same functions before persisting.
2. **Persist.** A `StorageAdapter` saves and loads whole lists. Today that's `localStorage`. A hosted
   database can replace it without touching the UI.
3. **Ingest.** An `ItemSource` supplies a list's items. Today that's manual entry. Stack, CSV, Goodreads or
   TMDB importers implement the same interface.

`ListService` (`lib/lists.ts`) is the engine's public API and ties the three together. Pages and hooks only
talk to the service.

## Running locally

Requires **Node 20+** (see `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script                 | What it does                           |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | Dev server on port 3000                |
| `npm run build`        | Production build                       |
| `npm run start`        | Serve the production build             |
| `npm run lint`         | ESLint (Next + TypeScript)             |
| `npm run typecheck`    | `tsc --noEmit`                         |
| `npm run format`       | Prettier (with Tailwind class sorting) |
| `npm run format:check` | Prettier in check mode                 |

Data lives in your browser's `localStorage` under the key `rankd:v1`. To reset (including the seed list),
delete that key in devtools and reload.

## Architecture

```
types/list.ts                 List, Item, ItemSourceType — the data model
lib/
  ranking.ts                  Pure ranking functions (move, append, remove, re-rank)
  lists.ts                    ListService — the engine API used by the UI
  storage/
    types.ts                  StorageAdapter interface
    local-storage-adapter.ts  LocalStorageAdapter (one versioned JSON snapshot under one key)
    seed.ts                   First-run seed data
    index.ts                  getStorage() — pick the adapter here
  sources/
    types.ts                  ItemSource interface
    manual-source.ts          ManualSource — items typed in by the user
    index.ts                  Source registry + createSource()
hooks/                        useLists / useList — client state + optimistic updates
components/                   Custom UI (no component library)
  list/                       Ranked list (dnd-kit + framer-motion), item card, notes editor, add form
  lists/                      Index cards, create-list form
app/                          App Router pages
  page.tsx                    /                    All lists
  list/[id]/page.tsx          /list/[id]           Ranking with drag-to-reorder + inline notes
  list/[id]/settings/         /list/[id]/settings  Rename, describe, delete
```

### Data model

```ts
List { id, title, description?, itemSourceType, createdAt, updatedAt, items: Item[] }
Item { id, title, description?, coverImageUrl?, notes?, rank }
```

`itemSourceType` is `"manual" | "stack-api" | "csv-import"`. Only `manual` has an adapter; the others are
reserved so stored data and UI can already reference them.

### Storage adapters

```ts
interface StorageAdapter {
  getLists(): Promise<List[]>;
  getList(id: string): Promise<List | null>;
  saveList(list: List): Promise<List>; // upsert
  deleteList(id: string): Promise<void>;
}
```

Every method is async, so a network-backed adapter fits the same shape. To add Postgres or Supabase,
implement the interface in `lib/storage/` and return it from `getStorage()`.

### Item sources

```ts
interface ItemSource {
  readonly type: ItemSourceType;
  getItems(): Promise<Item[]>; // in rank order
  addItem(item: NewItem): Promise<Item>; // appended at the bottom, id + rank assigned
}
```

To add a source: implement `ItemSource`, register a factory in `lib/sources/index.ts`, and add its label to
`SOURCE_LABELS`. `ListService` resolves the right source from each list's `itemSourceType`.

### UI notes

- Dark by default: black background, white text, and one accent colour (`#ff7a1a`, defined in
  `app/globals.css` under `@theme`).
- Drag-and-drop uses `@dnd-kit` with pointer and keyboard sensors. To reorder from the keyboard, focus a
  handle, press space, move with the arrow keys, then press space to drop. Screen readers hear each step
  announced by title and rank.
- `framer-motion` animates the lift while dragging, rank numbers ticking over, items entering and leaving,
  and notes expanding. The drop springs back into place. OS "reduce motion" is respected.

## Deploying

Vercel deploy is a planned follow-up. The app is a standard Next.js 15 project with no environment
variables yet, so importing the repo into Vercel should work as-is.
