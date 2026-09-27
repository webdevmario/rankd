import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;
const TIMEOUT_MS = 10_000;

/**
 * GET /api/image?url=…: fetches a cover image server side so the share
 * composer can inline it. Many image hosts don't send CORS headers, which
 * would otherwise blank the cover in an exported PNG. Only images are passed
 * through.
 */
export async function GET(request: NextRequest) {
  const target = parseHttpUrl(request.nextUrl.searchParams.get("url"));
  if (!target) return NextResponse.json({ error: "Pass an http(s) image URL." }, { status: 400 });

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "image/*" },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "Couldn't reach that image." }, { status: 502 });
  }
  if (!upstream.ok) return NextResponse.json({ error: "The image host refused." }, { status: 502 });

  const type = upstream.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) {
    return NextResponse.json({ error: "That URL isn't an image." }, { status: 415 });
  }
  if (Number(upstream.headers.get("content-length") ?? 0) > MAX_BYTES) {
    return NextResponse.json({ error: "That image is too large." }, { status: 413 });
  }

  const body = await upstream.arrayBuffer();
  if (body.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "That image is too large." }, { status: 413 });
  }

  return new NextResponse(body, {
    headers: { "content-type": type, "cache-control": "private, max-age=86400" },
  });
}

function parseHttpUrl(value: string | null): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}
