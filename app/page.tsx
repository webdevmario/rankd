import { findLists } from "@/lib/server/lists-repo";
import { ListsIndex } from "./lists-index";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Rendered with the lists already in place; if the database is unreachable the page loads them itself.
  const lists = await findLists().catch(() => undefined);
  return <ListsIndex initialLists={lists} />;
}
