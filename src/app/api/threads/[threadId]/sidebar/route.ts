import { NextResponse } from "next/server";
import { getThread, getNotes } from "@/lib/inbox";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await ctx.params;
  if (!threadId) {
    return NextResponse.json({ error: "Missing threadId" }, { status: 400 });
  }
  const thread = await getThread(threadId);
  if (!thread)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const notes = await getNotes(threadId);
  return NextResponse.json({ contact: thread.contact, notes });
}
