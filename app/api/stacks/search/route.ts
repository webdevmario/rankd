import { NextResponse, type NextRequest } from "next/server";
import { searchStacksShelf } from "@/lib/server/stacks";

export const dynamic = "force-dynamic";

/** GET /api/stacks/search?q=carrie: books on your Stacks shelf, for "Add a book" on a Books list. */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 200);
  try {
    return NextResponse.json({ books: await searchStacksShelf(q) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Couldn't reach Stacks." }, { status: 502 });
  }
}
