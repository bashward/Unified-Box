import { NextResponse } from "next/server";
import { pusherServer, threadChannel } from "@/lib/realtime/pusher";
import { sendMessageInput } from "@/lib/validators/message";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { sendSMS, sendWhatsApp } from "@/lib/integrations/twilio";
import { logEvent } from "@/lib/analytics/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const user = session.user;

    const json = await req.json();
    const input = sendMessageInput.parse(json);
    const now = new Date();
    const scheduleAt = input.scheduleAt
      ? typeof input.scheduleAt === "string"
        ? new Date(input.scheduleAt)
        : input.scheduleAt
      : undefined;

    if (!input.contactId && !input.threadId) {
      return NextResponse.json(
        { error: "Provide contactId or threadId" },
        { status: 400 },
      );
    }

    //resolve contact and thread
    const thread = input.threadId
      ? await prisma.thread.findUnique({
          where: { id: input.threadId },
          include: { contact: true },
        })
      : null;

    const contact =
      thread?.contact ??
      (input.contactId
        ? await prisma.contact.findUnique({ where: { id: input.contactId } })
        : null);

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const ensureThread =
      thread ??
      (await prisma.thread.create({
        data: {
          teamId: session.teamId,
          contactId: contact.id,
          channel: input.channel,
          lastMessageAt: now,
        },
      }));

    if (scheduleAt && scheduleAt > now) {
      const scheduled = await prisma.message.create({
        data: {
          teamId: session.teamId,
          threadId: ensureThread.id,
          authorId: user.id,
          channel: input.channel,
          direction: "outbound",
          body: input.body,
          media: input.media ?? undefined,
          status: "scheduled",
          scheduledAt: input.scheduleAt,
        },
        include: { thread: { include: { contact: true } } },
      });
      await pusherServer.trigger(
        threadChannel(scheduled.threadId),
        "message.created",
        { message: scheduled },
      );
      return NextResponse.json({ message: scheduled }, { status: 201 });
    }

    //send via Twilio
    const to = contact.phone;
    const provider =
      input.channel === "sms"
        ? await sendSMS(to, input.body)
        : await sendWhatsApp(to, input.body, input.media);

    const saved = await prisma.message.create({
      data: {
        teamId: session.teamId,
        threadId: ensureThread.id,
        authorId: user.id,
        channel: input.channel,
        direction: "outbound",
        body: input.body,
        media: input.media ?? undefined,
        status: "sent",
        providerId: provider.sid,
        sentAt: now,
      },
    });

    await pusherServer.trigger(
      threadChannel(saved.threadId),
      "message.created",
      { message: saved },
    );

    //bump thread timestamps/unreads
    await prisma.thread.update({
      where: { id: ensureThread.id },
      data: { lastMessageAt: now },
    });

    await logEvent("message.created", {
      id: saved.id,
      dir: "outbound",
      channel: saved.channel,
    });

    return NextResponse.json({ message: saved });
  } catch (err: any) {
    const msg = err?.message ?? "Failed to send";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
