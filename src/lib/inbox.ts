import { prisma } from "@/lib/db";

export type ThreadsFilter = {
  unread?: boolean;
  scheduled?: boolean;
  channel?: "sms" | "whatsapp";
  search?: string;
  limit?: number;
};

export async function getThreads(filter: ThreadsFilter = {}) {
  const { unread, scheduled, channel, search, limit = 50 } = filter;

  return prisma.thread.findMany({
    where: {
      ...(channel ? { channel } : {}),
      ...(unread ? { unreadCount: { gt: 0 } } : {}),
      ...(scheduled ? { messages: { some: { status: "scheduled" } } } : {}),
      ...(search
        ? {
            OR: [
              { contact: { name: { contains: search, mode: "insensitive" } } },
              { contact: { phone: { contains: search } } },
              {
                messages: {
                  some: { body: { contains: search, mode: "insensitive" } },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      contact: true,
      messages: { take: 1, orderBy: { createdAt: "desc" } },
    },
    orderBy: { lastMessageAt: "desc" },
    take: limit,
  });
}

export async function getThread(threadId: string) {
  return prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getNotes(threadId: string) {
  return prisma.note.findMany({
    where: { threadId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true, image: true } } },
  });
}