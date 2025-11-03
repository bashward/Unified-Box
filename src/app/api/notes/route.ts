export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createNoteInput } from "@/lib/validators/note"
import { pusherServer, threadChannel } from "@/lib/realtime/pusher"

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const input = createNoteInput.parse(json);

  const note = await prisma.note.create({
    data: {
      threadId: input.threadId,
      body: input.body,
      visibility: input.visibility as any,
      authorId: session.user.id,
    },
    include: { author: { select: { name: true, email: true } } },
  });
   
  await pusherServer.trigger(
  threadChannel(note.threadId),
  "note.created",
  { note }
)

  return NextResponse.json({ note });
}
