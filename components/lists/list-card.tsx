import Link from "next/link";
import { TierChip } from "@/components/tier/tier-styles";
import { sortByRank } from "@/lib/ranking";
import type { List } from "@/types/list";

const dateFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

export function ListCard({ list }: { list: List }) {
  const top = sortByRank(list.items).slice(0, 3);
  const count = list.items.length;

  return (
    <Link
      href={`/list/${list.id}`}
      className="group block rounded-2xl border border-line bg-surface p-5 transition-[translate,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-raised hover:shadow-[0_14px_40px_-24px_rgba(0,0,0,1)]"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg leading-snug font-semibold text-white">{list.title}</h2>
        <span className="mt-1 shrink-0 font-mono text-xs text-faint">
          {count} {count === 1 ? "item" : "items"}
        </span>
      </div>
      {list.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{list.description}</p>}

      {top.length > 0 ? (
        <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {top.map((item) => (
            <li key={item.id} className="flex min-w-0 items-baseline gap-1.5">
              {list.rankingMode === "tier" ? (
                item.tier ? (
                  <TierChip tier={item.tier} className="self-center" />
                ) : (
                  <span className="font-mono text-xs text-faint">–</span>
                )
              ) : (
                <span className="font-mono text-xs text-accent">{item.rank}</span>
              )}
              <span className="truncate text-neutral-300">{item.title}</span>
            </li>
          ))}
          {count > 3 && <li className="text-faint">+{count - 3} more</li>}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-faint">Nothing ranked yet</p>
      )}

      <p className="mt-4 text-xs text-faint">
        Updated {dateFormat.format(new Date(list.updatedAt))}
        <span className="ml-2 text-accent opacity-0 transition-opacity group-hover:opacity-100">Open →</span>
      </p>
    </Link>
  );
}
