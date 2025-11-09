// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 0) Team
  const team = await prisma.team.upsert({
    where: { id: "default-team" },
    update: {},
    create: { id: "default-team", name: "Demo Team" },
  });

  // 1) Users
  const [admin, agent] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: { teamId: team.id, role: "admin" },
      create: {
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
        teamId: team.id,
      },
    }),
    prisma.user.upsert({
      where: { email: "agent@example.com" },
      update: { teamId: team.id, role: "agent" },
      create: {
        email: "agent@example.com",
        name: "Agent Annie",
        role: "agent",
        teamId: team.id,
      },
    }),
  ]);

  // 2) Contacts (scoped by teamId + phone)
  const [c1, c2] = await Promise.all([
    prisma.contact.upsert({
      where: { teamId_phone: { teamId: team.id, phone: "+12297387161" } },
      update: { name: "Nikhil (You)", waOptIn: true },
      create: {
        phone: "+12297387161",
        name: "Nikhil (You)",
        waOptIn: true,
        teamId: team.id,
      },
    }),
    prisma.contact.upsert({
      where: { teamId_phone: { teamId: team.id, phone: "+14150000002" } },
      update: { name: "Test User", waOptIn: false },
      create: {
        phone: "+14150000002",
        name: "Test User",
        waOptIn: false,
        teamId: team.id,
      },
    }),
  ]);

  // 3) Threads (one per channel, unique by teamId+contactId+channel)
  const tSms = await prisma.thread.upsert({
    where: {
      teamId_contactId_channel: {
        teamId: team.id,
        contactId: c1.id,
        channel: "sms",
      },
    },
    update: { ownerId: agent.id },
    create: {
      contactId: c1.id,
      ownerId: agent.id,
      channel: "sms",
      teamId: team.id,
      lastMessageAt: new Date(),
      unreadCount: 0,
    },
  });

  const tWa = await prisma.thread.upsert({
    where: {
      teamId_contactId_channel: {
        teamId: team.id,
        contactId: c1.id,
        channel: "whatsapp",
      },
    },
    update: { ownerId: agent.id },
    create: {
      contactId: c1.id,
      ownerId: agent.id,
      channel: "whatsapp",
      teamId: team.id,
      lastMessageAt: new Date(),
      unreadCount: 0,
    },
  });

  // 4) Messages (mix of outbound/inbound, stamped with teamId)
  const now = Date.now();
  const mTimes = [
    new Date(now - 1000 * 60 * 15),
    new Date(now - 1000 * 60 * 10),
    new Date(now - 1000 * 60 * 5),
    new Date(now - 1000 * 60 * 2),
  ];

  await prisma.message.createMany({
    data: [
      {
        teamId: team.id,
        threadId: tSms.id,
        authorId: agent.id,
        channel: "sms",
        direction: "outbound",
        body: "Hey! This is Unified Box (SMS). How can we help?",
        status: "sent",
        sentAt: mTimes[0],
        createdAt: mTimes[0],
      },
      {
        teamId: team.id,
        threadId: tSms.id,
        authorId: null,
        channel: "sms",
        direction: "inbound",
        body: "Got it. Just testing the flow",
        status: "delivered",
        sentAt: mTimes[1],
        createdAt: mTimes[1],
      },
      {
        teamId: team.id,
        threadId: tWa.id,
        authorId: agent.id,
        channel: "whatsapp",
        direction: "outbound",
        body: "Hello from WhatsApp! You should see media soon.",
        status: "sent",
        sentAt: mTimes[2],
        createdAt: mTimes[2],
      },
      {
        teamId: team.id,
        threadId: tWa.id,
        authorId: null,
        channel: "whatsapp",
        direction: "inbound",
        body: "Looks good. Can I send an image?",
        status: "delivered",
        sentAt: mTimes[3],
        createdAt: mTimes[3],
      },
    ],
  });

  // 5) Update thread meta (lastMessageAt / unreadCount)
  await prisma.thread.update({
    where: { id: tSms.id },
    data: { lastMessageAt: mTimes[1], unreadCount: 1 },
  });
  await prisma.thread.update({
    where: { id: tWa.id },
    data: { lastMessageAt: mTimes[3], unreadCount: 1 },
  });

  // 6) Notes (scoped)
  await prisma.note.createMany({
    data: [
      {
        teamId: team.id,
        threadId: tSms.id,
        authorId: agent.id,
        visibility: "public",
        body: "Customer prefers SMS for quick replies.",
        createdAt: new Date(now - 1000 * 60 * 9),
      },
      {
        teamId: team.id,
        threadId: tWa.id,
        authorId: admin.id,
        visibility: "private",
        body: "Trial-mode: ensure number is verified in Twilio.",
        createdAt: new Date(now - 1000 * 60 * 1),
      },
    ],
  });

  // 7) EventLog (scoped)
  await prisma.eventLog.createMany({
    data: [
      { teamId: team.id, type: "seed.init", payload: { users: 2, contacts: 2 } },
      { teamId: team.id, type: "message.created", payload: { threadId: tSms.id } },
    ],
  });

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
