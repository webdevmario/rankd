-- Lists and their ranked items. Mirrors types/list.ts.

create table lists (
  id uuid primary key,
  title text not null check (length(trim(title)) > 0),
  description text,
  item_source_type text not null default 'manual',
  ranking_mode text not null default 'tier' check (ranking_mode in ('tier', 'linear')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table items (
  id uuid primary key,
  list_id uuid not null references lists (id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text,
  -- An http(s) URL, or an uploaded photo stored as a small JPEG data URL.
  cover_image_url text,
  notes text,
  -- 1-based and contiguous within a list; in tier mode, board reading order (S to F, then unranked).
  rank integer not null check (rank > 0),
  -- Null means unranked.
  tier text check (tier in ('S', 'A', 'B', 'C', 'D', 'F'))
);

create index items_list_id_rank on items (list_id, rank);
