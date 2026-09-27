"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { ShareComposer } from "@/components/share/share-composer";
import { ErrorState, ListNotFound, SkeletonRows } from "@/components/status";
import { useList } from "@/hooks/use-list";

export function ShareView({ id }: { id: string }) {
  const { list, status } = useList(id);

  useEffect(() => {
    if (list) document.title = `Share ${list.title} · rankd`;
  }, [list]);

  return (
    <div>
      <Link
        href={`/list/${id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to list
      </Link>

      {status === "loading" && <SkeletonRows count={4} />}
      {status === "error" && <ErrorState message="Something went wrong loading this list." />}
      {status === "not-found" && <ListNotFound />}

      {status === "ready" && list && (
        <>
          <header className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight">Share image</h1>
            <p className="mt-1 text-muted-foreground">{list.title}</p>
          </header>
          <ShareComposer list={list} />
        </>
      )}
    </div>
  );
}
