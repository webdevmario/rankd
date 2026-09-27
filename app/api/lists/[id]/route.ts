import { NextResponse, type NextRequest } from "next/server";
import { findList, removeList, upsertList } from "@/lib/server/lists-repo";
import { InvalidListError, parseList } from "@/lib/server/parse-list";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

/** GET /api/lists/:id */
export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  const list = await findList(id).catch(() => null);
  return list ? NextResponse.json(list) : NextResponse.json({ error: "List not found." }, { status: 404 });
}

/** PUT /api/lists/:id: inserts or replaces the whole list, items included. */
export async function PUT(request: NextRequest, { params }: Context) {
  const { id } = await params;
  let list;
  try {
    list = parseList(await request.json());
  } catch (error) {
    const message = error instanceof InvalidListError ? error.message : "Body must be a JSON list.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  if (list.id !== id) return NextResponse.json({ error: "List id doesn't match the URL." }, { status: 400 });
  return NextResponse.json(await upsertList(list));
}

/** DELETE /api/lists/:id */
export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  await removeList(id);
  return new NextResponse(null, { status: 204 });
}
