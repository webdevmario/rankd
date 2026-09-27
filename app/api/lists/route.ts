import { NextResponse } from "next/server";
import { findLists } from "@/lib/server/lists-repo";

export const dynamic = "force-dynamic";

/** GET /api/lists: every list with its items, most recently updated first. */
export async function GET() {
  return NextResponse.json(await findLists());
}
