# rankd

A personal ranking engine. Make a list, add things, then drag them into the tier (or the exact order) they
deserve.

The first list is **Stephen King: Recently Read**, but nothing in the app is specific to books. rankd is
built as a small, reusable engine: lists and ranks are generic, where data is _stored_ is behind one
interface, and where items _come from_ is behind another.

## The ranking engine

Every ranking is a `List` of `Item`s. Each item has a 1-based `rank`, and ranks are always contiguous
(1, 2, 3, …). The engine does three jobs:

1. **Rank.** Pure functions in `lib/ranking.ts` (`moveItem`, `appendItem`, `removeItem`, …) take items and
   return a new, re-ranked array. The UI applies them optimistically, so drag-and-drop never flickers, and
   the service applies the same functions before persisting.
2. **Persist.** A `StorageAdapter` saves and loads whole lists. Today that's Postgres, reached through the
   app's own API routes, so every device sees the same lists.
3. **Ingest.** An `ItemSource` supplies a list's items. Today that's manual entry. Stack, CSV, Goodreads or
   TMDB importers implement the same interface.

`ListService` (`lib/lists.ts`) is the engine's public API and ties the three together. Pages and hooks only
talk to the service.

### Ranking modes

Each list has a `rankingMode`, and a Tier / Linear switch on the list page flips between them. Both views
read the same data.

- **`tier`** (the default): the list's tier rows plus an **Unranked** pool, where new items land. Drag
  cards between rows or within a row. Each item's `tier` (a tier id) is stored on the item; no tier means
  unranked.
- **`linear`**: the original numbered list you drag to reorder.

`rank` is always the order you'd read the tier board in: the top row left to right, then the next, and
so on down to the last row, then Unranked. Every tier move re-ranks in that order (`lib/tiers.ts`), so the linear view always matches
the board. Reordering in the linear view changes `rank` but not tiers.

### Custom tiers

Every list owns its rows (`list.tiers`: id, label, colour), and new lists start with the classic S to F.
Clicking a row's label opens the tier editor (`components/tier/tier-editor.tsx`: a popover on desktop, a
bottom sheet on phones). Name and colour are a draft, previewed on the label, that Save or Enter commits
and Cancel, Escape or clicking away discards. Move up or down, add above or below, and delete act at once
(saving any draft first). Colours are presets in `lib/tier-colors.ts`. Deleting a row with items asks first; its items go to the top
of Unranked. `applyTiers` in `lib/tiers.ts` re-seats items and re-ranks after any change to the rows.
The classic rows keep the ids `S` to `F`, so the "X/10" import mapping still lands on them.

## Running locally

Requires **Node 20+** (see `.nvmrc`) and **Postgres** (the Homebrew `postgresql@16` server on this Mac,
shared with Stacks; rankd has its own `rankd` database and `rankd` login).

```bash
npm install
echo 'DATABASE_URL=postgres://rankd:<password>@localhost:5432/rankd' > .env.local
npm run db:migrate # creates or updates the tables
npm run dev        # http://localhost:3010
```

`.env.local` is gitignored. Both `next dev`/`next start` and `npm run db:migrate` read it.

rankd uses port **3010** for both dev and production so it doesn't collide with the other apps on this Mac.
Stop the production service (`npm run prod:stop`) before running `npm run dev`.

| Script                 | What it does                           |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | Dev server on port 3010                |
| `npm run build`        | Production build                       |
| `npm run start`        | Serve the production build on 3010     |
| `npm run lint`         | ESLint (Next + TypeScript)             |
| `npm run typecheck`    | `tsc --noEmit`                         |
| `npm run format`       | Prettier (with Tailwind class sorting) |
| `npm run format:check` | Prettier in check mode                 |
| `npm run db:migrate`   | Apply new `db/migrations/*.sql` files  |

### Database

Two tables, `lists` and `items` (`db/migrations/001_lists_and_items.sql`); each list's tier rows are a
`jsonb` column on `lists` (`002_custom_tiers.sql`). Add a schema change as the next
numbered `.sql` file; `npm run db:migrate` applies each file once, in order, and records it in
`schema_migrations`. `npm run prod:deploy` runs it before building.

Saving a list replaces the list row and all of its items in one transaction (`lib/server/lists-repo.ts`),
after the API validates the payload (`lib/server/parse-list.ts`). Pages refetch when the tab regains focus,
so an edit on your phone shows up on the Mac when you switch back to it. Last write wins.

### Importing lists saved before the database

Before Postgres, each browser kept its own lists in `localStorage` (key `rankd:v1`). The first time a
browser with such data opens the home page, a banner offers to import it. Import from the device with the
latest changes and choose "Skip on this device" on the others, since each browser's copy has its own ids and
importing twice gives two copies. Skipping only hides the banner; the local copy stays in `localStorage`
(`lib/storage/local-import.ts`).

Imported data goes through `lib/storage/migrations.ts` first: pre-tier lists get tiers from any "X/10"
rating in an item's notes or description (9 to 10 is S, 8 A, 7 B, 6 C, 5 D, 4 or below F, no rating goes
to Unranked), the old em dash King title is renamed, and the " · 6/10 in Stacks" description suffix is
dropped.

### Stephen King list from Stacks

The King list was originally seeded from `data/king-books.json`, generated from the Stacks book log (the
Mario profile's Stephen King reads) by a one-time script. It's kept for reference and a possible Stacks sync
later; nothing reads it at runtime any more.

```bash
npm run import:stacks   # reads ../stacks/.env → Stacks Postgres (read-only) → data/king-books.json
```

## Running on the Mac over Tailscale

This follows the same setup as `playoff-picks`, `stacks` and the other apps on this Mac. A launchd agent
runs `next start` on port 3010, starts it at login and restarts it if it crashes. Next listens on every
network interface, so any device on the tailnet can reach it directly. No `tailscale serve` is involved.

- On the Mac: http://localhost:3010
- From the tailnet: http://shady-mac-mini.taila545c3.ts.net:3010 (or http://100.84.244.2:3010)

First-time install:

```bash
npm run build          # production build → .next/
npm run prod:install   # copy scripts/com.rankd.plist → ~/Library/LaunchAgents/
npm run prod:start     # load the launchd job
npm run prod:status    # PID + last exit code 0
```

Day to day:

```bash
npm run prod:deploy    # migrate + build + restart (run after code changes)
npm run prod:restart
npm run prod:stop
npm run prod:logs      # /tmp/rankd.log
npm run prod:errors    # /tmp/rankd-error.log
```

The service reads `DATABASE_URL` from `.env.local` in the main checkout
(`~/Documents/development/projects/rankd`). Every device and URL shares the same lists. There's no login:
anyone who can reach the tailnet URL can edit, same as the other apps here.

## Architecture

```
types/list.ts                 List, Item, ItemSourceType: the data model
lib/
  ranking.ts                  Pure ranking functions (move, append, remove, re-rank)
  lists.ts                    ListService: the engine API used by the UI
  storage/
    types.ts                  StorageAdapter interface
    http-storage-adapter.ts   HttpStorageAdapter: talks to /api/lists
    local-import.ts           Reads pre-database localStorage lists for the one-time import
    migrations.ts             Upgrades lists written by older versions of the app
    index.ts                  getStorage(): pick the adapter here
  server/                     Server only
    db.ts                     pg Pool (DATABASE_URL) + transaction helper
    lists-repo.ts             SQL: find, upsert and delete lists with their items
    parse-list.ts             Validates lists sent to the API
  sources/
    types.ts                  ItemSource interface
    manual-source.ts          ManualSource: items typed in by the user
    index.ts                  Source registry + createSource()
hooks/                        useLists / useList: client state + optimistic updates
components/
  ui/                         shadcn/ui components (generated, owned here; see components.json)
  responsive-modal.tsx        Dialog on desktop, swipe-down Drawer on phones
  confirm-dialog.tsx          "Are you sure?" AlertDialog for destructive actions
  item-cover.tsx              Cover image, or an initials placeholder when there isn't one
  list/                       Ranked list (dnd-kit + framer-motion), item card, add/edit item modal, cover picker
  lists/                      Index cards, new/edit list modal
  tier/                       Tier board, tier card, tier summary, tier editor
  share/                      Share-image composer: export card, themes, controls
app/                          App Router pages
  page.tsx                    /                    All lists
  list/[id]/page.tsx          /list/[id]           Tier board or linear ranking; add, edit and list modals
  list/[id]/share/page.tsx    /list/[id]/share     Share-image composer (PNG export)
  api/lists/route.ts          GET /api/lists       Every list with its items
  api/lists/[id]/route.ts     GET, PUT, DELETE     One list (PUT upserts the whole list)
  api/image/route.ts          GET /api/image?url=  Image proxy so exported covers aren't blocked by CORS
db/migrations/                Numbered SQL migrations (npm run db:migrate)
```

### Data model

```ts
List { id, title, description?, itemSourceType, rankingMode, tiers: TierDef[], createdAt, updatedAt, items: Item[] }
TierDef { id, label, color }
Item { id, title, description?, coverImageUrl?, notes?, rank, tier? }   // tier: a TierDef id
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

The browser uses `HttpStorageAdapter`, which calls the API routes; they read and write Postgres. To store
somewhere else, implement the interface in `lib/storage/` and return it from `getStorage()`.

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

- UI is built on [shadcn/ui](https://ui.shadcn.com) (base-nova style, Base UI primitives, lucide icons). Add
  components with `npx shadcn@latest add <name>`; they land in `components/ui/` and are ours to edit.
- Dark only: `<html class="dark">`, with the palette defined once in `app/globals.css` as shadcn's semantic
  tokens (`--primary` is the orange accent `#ff7a1a`, `--muted-foreground` the grey text, and so on) plus
  rankd extras (`--faint`, `--border-strong`). Tier label colours are presets in `lib/tier-colors.ts`.
- Drag-and-drop uses `@dnd-kit` with pointer and keyboard sensors. To reorder from the keyboard, focus a
  handle, press space, move with the arrow keys, then press space to drop. Screen readers hear each step
  announced by title and rank.
- `framer-motion` animates the lift while dragging, rank numbers ticking over, items entering and leaving,
  and modals opening. The drop springs back into place. OS "reduce motion" is respected.
- New list, edit list, add item and edit item are all modals (`components/responsive-modal.tsx`): a Dialog
  on desktop and a swipe-to-dismiss Drawer on phones. Removing an item or deleting a list asks first.
- Covers can be an image URL or a photo uploaded from the device. Uploads are shrunk to a ~540px JPEG in
  the browser (`lib/image.ts`) and stored as a data URL in `coverImageUrl` (a text column in Postgres),
  around 30 to 60 KB each.
- **Share** on a list opens a Carbon-style composer (`components/share/`): a themed card (Ember, Collage,
  Midnight, Paper) in a fixed or auto frame, exported to PNG with `modern-screenshot`. Covers are inlined as
  data URLs through `/api/image` first (Open Library covers are upgraded to the large size), and fixed
  frames pick the largest cover size that fits every tier (`lib/share/options.ts`). Settings are remembered
  per browser in `localStorage` (`rankd:share-options`).

## Deploying

Vercel deploy is a planned follow-up. It needs a Postgres reachable from Vercel (Neon, Supabase or similar)
with `DATABASE_URL` set in the project, and `npm run db:migrate` run against it once.
