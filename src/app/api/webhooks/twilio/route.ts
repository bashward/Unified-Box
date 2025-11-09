export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { validateTwilioRequest } from "@/lib/integrations/twilio";
import { prisma } from "@/lib/db";
import { pusherServer, threadChannel } from "@/lib/realtime/pusher";
import { webhookInput } from "@/lib/validators/webhook";
import { logEvent } from "@/lib/analytics/logger";
import { requireSession } from "@/lib/auth/guards";

export async function POST(req: Request) {
  const raw = await req.text();
  const params = Object.fromEntries(new URLSearchParams(raw));
  const url = process.env.PUBLIC_WEBHOOK_URL!;
  const sig = (req.headers.get("x-twilio-signature") || "").trim();
  const session = await requireSession()

  if (!validateTwilioRequest(url, sig, params)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const p = webhookInput.parse(params);
  const from = p.From;
  const to = p.To;
  const body = p.Body ?? "";
  const isWA = from.startsWith("whatsapp:");
  const phone = from.replace("whatsapp:", "");
  const channel = isWA ? "whatsapp" : "sms";

  //upsert contact
  const contact = await prisma.contact.upsert({
    where: { teamId_phone: { teamId: session.teamId, phone } },
    create: { teamId: session.teamId, phone, name: null },
    update: {},
  });

  //ensure thread for
  let thread = await prisma.thread.findFirst({
    where: { contactId: contact.id, channel },
  });
  if (!thread) {
    thread = await prisma.thread.create({
      data: { teamId: session.teamId, contactId: contact.id, channel },
    });
  }

  //collect media URLs
  const mediaCount = Number(p.NumMedia ?? "0") || 0;
  const media = mediaCount
    ? Array.from({ length: mediaCount }).map((_, i) => ({
        url: (params[`MediaUrl${i}`] as string) || "",
        contentType: (params[`MediaContentType${i}`] as string) || "",
      }))
    : undefined;

  //insert inbound message
  const message = await prisma.message.create({
    data: {
      teamId: session.teamId,
      threadId: thread.id,
      authorId: null,
      channel: channel as any,
      direction: "inbound",
      body,
      media: media as any,
      status: "delivered",
      providerId: p.MessageSid,
      sentAt: new Date(),
    },
  });

  await pusherServer.trigger(
    threadChannel(message.threadId),
    "message.created",
    { message },
  );

  //bump thread metadata
  await prisma.thread.update({
    where: { id: thread.id },
    data: { lastMessageAt: new Date(), unreadCount: { increment: 1 } },
  });

  await logEvent("webhook.inbound", { id: message.id, from: from });

  //respond
  return new Response("", {
    status: 200,
    headers: { "content-type": "text/xml" },
  });
}
