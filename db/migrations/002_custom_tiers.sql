-- Each list owns its tier rows: an ordered array of { id, label, color }.
-- Existing lists get the classic S to F rows, whose ids ("S" … "F") match the
-- tier values items already store, so no item needs rewriting.

alter table lists
  add column tiers jsonb not null default '[
    {"id": "S", "label": "S", "color": "sunset"},
    {"id": "A", "label": "A", "color": "orange"},
    {"id": "B", "label": "B", "color": "yellow"},
    {"id": "C", "label": "C", "color": "green"},
    {"id": "D", "label": "D", "color": "blue"},
    {"id": "F", "label": "F", "color": "grey"}
  ]'::jsonb;

-- items.tier now holds a tier id from the list's own rows. Null still means unranked.
alter table items drop constraint items_tier_check;
