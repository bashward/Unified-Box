import { prisma } from "@/lib/db";

//counts by channel (last 7 days)
export async function messagesByChannel7d() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const rows = await prisma.message.groupBy({
    by: ["channel"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });
  const map: Record<string, number> = { sms: 0, whatsapp: 0 };
  rows.forEach(r => (map[r.channel] = r._count._all));
  return map;
}


export async function avgFirstResponseTime24h() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  //pull the minimal set of messages for that window
  const msgs = await prisma.message.findMany({
    where: { createdAt: { gte: since } },
    select: {
      id: true,
      threadId: true,
      direction: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // in-memory compute
  const firstInbound = new Map<string, Date>();
  const deltas: number[] = [];

  for (const m of msgs) {
    if (m.direction === "inbound") {
      if (!firstInbound.has(m.threadId)) firstInbound.set(m.threadId, m.createdAt);
    } else if (m.direction === "outbound") {
      const t0 = firstInbound.get(m.threadId);
      if (t0) {
        deltas.push(m.createdAt.getTime() - t0.getTime());
        firstInbound.delete(m.threadId);
      }
    }
  }

  if (!deltas.length) return null;
  const avgMs = Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length);
  return { avgMs, avgMinutes: Math.round(avgMs / 60000) };
}
