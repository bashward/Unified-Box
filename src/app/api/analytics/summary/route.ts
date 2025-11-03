import { NextResponse } from "next/server";
import { messagesByChannel7d, avgFirstResponseTime24h } from "@/lib/analytics/queries";

export const revalidate = 0;

export async function GET() {
  const [byChannel, avg] = await Promise.all([
    messagesByChannel7d(),
    avgFirstResponseTime24h(),
  ]);
  return NextResponse.json({ byChannel, avg });
}
