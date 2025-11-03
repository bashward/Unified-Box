import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Users
  const [admin, agent] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: { email: "admin@example.com", name: "Admin", role: "admin" },
    }),
    prisma.user.upsert({
      where: { email: "agent@example.com" },
      update: {},
      create: {
        email: "agent@example.com",
        name: "Agent Annie",
        role: "agent",
      },
    }),
  ]);

  // Contacts
  const [c1, c2] = await Promise.all([
    prisma.contact.upsert({
      where: { phone: "+919999000001" },
      update: {},
      create: { phone: "+919999000001", name: "Nikhil (You)", waOptIn: true },
    }),
    prisma.contact.upsert({
      where: { phone: "+14150000002" },
      update: {},
      create: { phone: "+14150000002", name: "Test User", waOptIn: false },
    }),
  ]);

  // Threads (one per channel)
  const tSms = await prisma.thread.create({
    data: {
      contactId: c1.id,
      ownerId: agent.id,
      channel: "sms",
    },
  });

  const tWa = await prisma.thread.create({
    data: {
      contactId: c1.id,
      ownerId: agent.id,
      channel: "whatsapp",
    },
  });

  // Messages (mix of inbound/outbound)
  await prisma.message.createMany({
    data: [
      {
        threadId: tSms.id,
        authorId: agent.id,
        channel: "sms",
        direction: "outbound",
        body: "Hey! This is Unified Box (SMS). How can we help?",
        status: "sent",
        sentAt: new Date(),
      },
      {
        threadId: tSms.id,
        channel: "sms",
        direction: "inbound",
        body: "Got it. Just testing the flow",
        status: "delivered",
        sentAt: new Date(),
      },
      {
        threadId: tWa.id,
        authorId: agent.id,
        channel: "whatsapp",
        direction: "outbound",
        body: "Hello from WhatsApp! You should see media soon.",
        status: "sent",
        sentAt: new Date(),
      },
      {
        threadId: tWa.id,
        channel: "whatsapp",
        direction: "inbound",
        body: "Looks good. Can I send an image?",
        status: "delivered",
        sentAt: new Date(),
      },
    ],
  });

  // Update thread meta (lastMessageAt/unreadCount)
  await prisma.thread.update({
    where: { id: tSms.id },
    data: { lastMessageAt: new Date(), unreadCount: 1 },
  });
  await prisma.thread.update({
    where: { id: tWa.id },
    data: { lastMessageAt: new Date(), unreadCount: 1 },
  });

  // Notes
  await prisma.note.createMany({
    data: [
      {
        threadId: tSms.id,
        authorId: agent.id,
        visibility: "public",
        body: "Customer prefers SMS for quick replies.",
      },
      {
        threadId: tWa.id,
        authorId: admin.id,
        visibility: "private",
        body: "Trial-mode: ensure number is verified in Twilio.",
      },
    ],
  });

  // Example EventLog entries
  await prisma.eventLog.createMany({
    data: [
      { type: "seed.init", payload: { users: 2, contacts: 2 } },
      { type: "message.created", payload: { threadId: tSms.id } },
    ],
  });

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
