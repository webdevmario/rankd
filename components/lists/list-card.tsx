import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { List } from "@/types/list";

const dateFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

export function ListCard({ list }: { list: List }) {
  const count = list.items.length;

  return (
    <Link href={`/list/${list.id}`} className="group block rounded-xl">
      <Card className="gap-3 py-5 transition-colors duration-150 [--card-spacing:--spacing(5)] group-hover:bg-muted group-hover:ring-border-strong">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-lg font-semibold">{list.title}</CardTitle>
            <span className="mt-1 shrink-0 font-mono text-xs text-faint">
              {count} {count === 1 ? "item" : "items"}
            </span>
          </div>
          {list.description && <CardDescription className="line-clamp-2">{list.description}</CardDescription>}
        </CardHeader>
        <CardContent className="text-xs text-faint">
          Updated {dateFormat.format(new Date(list.updatedAt))}
        </CardContent>
      </Card>
    </Link>
  );
}
