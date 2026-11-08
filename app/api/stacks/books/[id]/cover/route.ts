import { NextResponse, type NextRequest } from "next/server";
import { STACKS_URL } from "@/lib/server/stacks";

export const dynamic = "force-dynamic";

const ONE_YEAR = 60 * 60 * 24 * 365;

type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/stacks/books/703/cover[?v=…]: a Stacks book's cover, proxied so
 * phones on the tailnet (which can't reach Stacks's localhost) can load it.
 * With `v` (Stacks's cover version) the image is cached for good, since a
 * new cover gets a new `v`; without it the browser checks back each time.
 */
export async function GET(request: NextRequest, { params }: Context) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Bad book id." }, { status: 400 });

  let upstream: Response;
  try {
    upstream = await fetch(`${STACKS_URL}/api/library/books/${id}/cover`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return NextResponse.json({ error: "Couldn't reach Stacks." }, { status: 502 });
  }
  if (upstream.status === 404) return NextResponse.json({ error: "No cover." }, { status: 404 });
  const type = upstream.headers.get("content-type") ?? "";
  if (!upstream.ok || !type.startsWith("image/")) {
    return NextResponse.json({ error: "Stacks couldn't load that cover." }, { status: 502 });
  }

  const versioned = request.nextUrl.searchParams.has("v");
  return new NextResponse(await upstream.arrayBuffer(), {
    headers: {
      "content-type": type,
      "cache-control": versioned ? `public, max-age=${ONE_YEAR}, immutable` : "no-cache",
    },
  });
}
