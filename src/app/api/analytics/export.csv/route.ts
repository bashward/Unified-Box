import { messagesByChannel7d, avgFirstResponseTime24h } from "@/lib/analytics/queries";

export const revalidate = 0;

export async function GET() {
  const [byChannel, avg] = await Promise.all([
    messagesByChannel7d(),
    avgFirstResponseTime24h(),
  ]);

  const rows = [
    ["metric", "value"],
    ["sms_7d", String(byChannel.sms ?? 0)],
    ["whatsapp_7d", String(byChannel.whatsapp ?? 0)],
    ["avg_first_response_ms_24h", avg?.avgMs != null ? String(avg.avgMs) : ""],
    ["avg_first_response_min_24h", avg?.avgMinutes != null ? String(avg.avgMinutes) : ""],
  ];

  const body = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="analytics.csv"',
    },
  });
}
