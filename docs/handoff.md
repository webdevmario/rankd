# rankd handoff

Written 2026-09-27 at the end of a long session, so a fresh thread can pick up. Read this, then `README.md`
(architecture, scripts, data model). Delete or rewrite this file once it's stale.

## Where things stand

rankd is live on the Mac mini and in daily use. Mario's real data (the "Stephen King" tier list, imported
from his phone) is in Postgres. `main` is pushed to GitHub (`webdevmario/rankd`) and deployed.

| Commit    | What                                                                               |
| --------- | ---------------------------------------------------------------------------------- |
| `adb41f1` | Long entry titles truncate to one line with an ellipsis (full title on hover)      |
| `24111be` | Wider layout: 1152px content, 3-column home grid, bigger tier board on desktop     |
| `1f666c6` | `scrollbar-gutter: stable`, visible ghost/outline hover, pointer cursor on buttons |
| `57fa763` | shadcn/ui, all forms as modals, photo covers, Postgres sync, one-time import       |

## Stack in one breath

Next.js 15 (App Router) + React 19, Tailwind v4, shadcn/ui (`base-nova` style, Base UI primitives, lucide
icons), dnd-kit + framer-motion for the boards, Postgres via `pg` behind `/api/lists` route handlers. The
browser talks to `ListService` (`lib/lists.ts`), which uses `HttpStorageAdapter`.

## Rules Mario has set

- **No em dashes anywhere** in this project: UI copy, data, comments, docs, commit messages. Use a colon,
  comma, period or parentheses.
- VS Code workspace lives at `~/Documents/development/workspaces/rankd.code-workspace` (his convention: one
  per project in that folder).
- He reviews on the Mac at http://localhost:3010, so "done" means merged, pushed and deployed (below).

## Ship workflow (what he expects)

Work happens in a worktree under `.claude/worktrees/`. To ship:

```bash
# in the worktree
npm run typecheck && npm run lint && npm run format:check
git add -A && git commit   # end the message with the Co-Authored-By line
# in the main checkout: ~/Documents/development/projects/rankd (on main)
git merge --ff-only <worktree-branch>
git push origin main       # GitHub sometimes times out; just retry
source ~/.nvm/nvm.sh && nvm use && npm install   # when deps changed
npm run prod:deploy        # db:migrate + build + restart launchd (com.rankd)
npm run prod:status        # PID and exit code 0
```

Then check `curl localhost:3010/api/lists` returns his lists.

## Database

- Homebrew `postgresql@16` on localhost:5432 (same server as Stacks, separate `rankd` database and `rankd`
  login). The `Mario` OS user is a superuser via `psql -d postgres`.
- `DATABASE_URL` is in gitignored `.env.local` in both the main checkout (prod reads it) and the worktree.
  A new worktree needs a copy: `cp ~/Documents/development/projects/rankd/.env.local .`
- Schema: `db/migrations/*.sql`, applied by `npm run db:migrate` (tracked in `schema_migrations`). Add
  changes as the next numbered file; never edit an applied one.
- Saving a list replaces the list row and all its items in one transaction. Last write wins. Pages refetch
  when the tab regains focus.
- Uploaded cover photos are small JPEG data URLs in `items.cover_image_url`.

## Testing gotchas

- A dev server in a worktree uses the **real** database. Test read-only, or clean up anything you write.
  Use a port other than 3010 (prod), e.g. `npx next dev -p 3011` via a throwaway `.claude/launch.json`.
- The desktop app's browser pane is often hidden: screenshots and clicks then fail, and animations and
  `requestAnimationFrame` stall (Base UI dialogs look "stuck" closing). Use `get_page_text` and JS
  (`element.click()`, native value setter + `input` event for React inputs) instead.
- `python3` is blocked on this Mac (Xcode license prompt). Use node or perl for scripted edits.

## shadcn notes

- Components live in `components/ui/` and are owned code; they've been Prettier-formatted to the repo style.
  Add more with `npx shadcn@latest add <name>`.
- `cn` comes from shadcn's own `cn` npm package, re-exported by `lib/utils.ts`.
- rankd's palette is shadcn's semantic tokens in `app/globals.css` (`<html class="dark">`, dark only):
  `primary` is the orange `#ff7a1a`, `muted-foreground` the grey text, `accent` (#262626) the hover fill.
  Extras: `faint`, `border-strong`. Tier colours are presets in `lib/tier-colors.ts`. Don't reintroduce the old names
  (`surface`, `line`, `danger`, old `accent` = orange).
- Base UI uses `render` props, not Radix's `asChild` (see `components/confirm-dialog.tsx`).
- Modals go through `components/responsive-modal.tsx` (Dialog on desktop, swipe-down Drawer under 640px).
  Parents keep dialog content in state separately from `open` so the exit animation has something to show
  (`app/list/[id]/list-detail.tsx`).

## Backlog and open threads

1. **Ask Mario which updates he felt weren't applied.** Mid-session he said "there are a lot of updates you
   didn't apply", probably because he was looking at the old prod build at the time. Everything from his
   original list shipped (hover lift removed, no item preview on cards, modals, sync, readable tier summary,
   photo upload, cover placeholders, Stacks text removed, tagline moved). Confirm nothing's missing.
2. **Custom tiers per list**: shipped (tier editor on each row label, presets only). Not done yet: drag to
   reorder rows (Move up/down buttons for now), "Clear row", and an Undo toast. Mario chose to skip Undo.
3. **Linear view on wide screens**: rows now stretch to 1152px, so notes run long. Offered: narrow that view
   or use two columns.
4. **Width**: offered going to 1280px or edge to edge if he wants it closer to TierMaker.
5. **Descriptions and notes** still clamp at two lines; offered one-line ellipsis to match titles.
6. **Stacks sync** later (he's undecided). `data/king-books.json` and `npm run import:stacks` are kept for it;
   nothing reads them at runtime.
7. **Vercel deploy** would need a hosted Postgres (Neon or Supabase) plus `DATABASE_URL` and a migrate run.
8. **No auth**: anyone on the tailnet can edit, same as his other apps. Fine for now.

## Small known quirks

- Pet Sematary has no cover in his real data (the one uploaded during testing was a test copy); he can upload
  one from the edit dialog.
- Old pre-database copies remain in each browser's `localStorage` (`rankd:v1`, marked handled). Harmless.
- On desktop the edit dialog focuses the title field on open; on phones it doesn't (keeps the keyboard down).
