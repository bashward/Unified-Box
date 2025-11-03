import { prisma } from "@/lib/db";

export async function logEvent(type: string, payload: any) {
  try {
    await prisma.eventLog.create({ data: { type, payload } });
  } catch { 
    
   }
}
