import type { Metadata } from "next";
import { cache } from "react";
import { findList } from "@/lib/server/lists-repo";
import { ListDetail } from "./list-detail";

type Props = { params: Promise<{ id: string }> };

/** One query per request, shared by the metadata and the page. Undefined when the database is unreachable. */
const loadList = cache((id: string) => findList(id).catch(() => undefined));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const list = await loadList((await params).id);
  return list ? { title: list.title } : {};
}

export default async function ListPage({ params }: Props) {
  const { id } = await params;
  // Rendered with the list already in place: null means not found, undefined leaves loading to the page.
  return <ListDetail id={id} initialList={await loadList(id)} />;
}
