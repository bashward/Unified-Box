export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { createNoteInput } from "@/lib/validators/note";
import { pusherServer, threadChannel } from "@/lib/realtime/pusher";

export async function POST(req: Request) {
  const session = await requireSession();

  const json = await req.json();
  const input = createNoteInput.parse(json);

  const note = await prisma.note.create({
    data: {
      teamId: session.teamId,
      threadId: input.threadId,
      body: input.body,
      visibility: input.visibility as any,
      authorId: session.user.id,
    },
    include: { author: { select: { name: true, email: true } } },
  });

  await pusherServer.trigger(threadChannel(note.threadId), "note.created", {
    note,
  });

  return NextResponse.json({ note });
}
