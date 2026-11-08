-- A list is about anything (free-text items) or about books. On a Books list,
-- items can be linked to a book in Stacks; a linked item's title, author and
-- cover are read live from Stacks, so cover_image_url stays null for it and
-- title is only a fallback for when Stacks can't be reached.

alter table lists
  add column kind text not null default 'anything' check (kind in ('anything', 'books'));

-- e.g. 'stacks:book:703'. Null for a free-text item.
alter table items
  add column source_ref text check (source_ref is null or source_ref ~ '^stacks:book:[0-9]+$');
