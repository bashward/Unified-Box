import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/guards";
import { sendSMS, sendWhatsApp } from "@/lib/integrations/twilio";
import { logEvent } from "@/lib/analytics/logger";

export const dynamic = "force-dynamic";
const BATCH_LIMIT = 20;

export async function GET() {
  const session = await requireSession();
  const user = session.user;
  const now = new Date();

  //find due messages
  const due = await prisma.message.findMany({
    where: {
      status: "scheduled",
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: "asc" },
    take: BATCH_LIMIT,
    include: {
      thread: { include: { contact: true } },
    },
  });

  const results: any[] = [];
  for (const m of due) {
    try {
      let providerSid: string | undefined;

      if (m.channel === "sms") {
        const res = await sendSMS(m.thread.contact.phone, m.body);
        providerSid = res.sid;
      } else {
        const res = await sendWhatsApp(
          m.thread.contact.phone,
          m.body,
          Array.isArray(m.media) ? (m.media as any[]) : undefined,
        );
        providerSid = res.sid;
      }

      await prisma.message.update({
        where: { id: m.id },
        data: { status: "sent", sentAt: new Date(), providerId: providerSid },
      });

      const updated = await prisma.message.update({
        where: { id: m.id },
        data: { status: "sent", sentAt: new Date() },
      });
      results.push({ id: m.id, ok: true });
    } catch (err: any) {
      await prisma.message.update({
        where: { id: m.id },
        data: { status: "failed" },
      });
      results.push({ id: m.id, ok: false, error: err?.message });
    }

    await logEvent("scheduler.dispatched", { id: m.id, channel: m.channel });
  }

  return NextResponse.json({ processed: results.length, results });
}
