/*
  Warnings:

  - A unique constraint covering the columns `[teamId,phone]` on the table `Contact` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamId,contactId,channel]` on the table `Thread` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `teamId` to the `Contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamId` to the `EventLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamId` to the `Note` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamId` to the `Thread` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamId` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Contact_phone_key";

-- DropIndex
DROP INDEX "public"."EventLog_type_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Message_threadId_idx";

-- DropIndex
DROP INDEX "public"."Note_threadId_idx";

-- DropIndex
DROP INDEX "public"."Thread_channel_idx";

-- DropIndex
DROP INDEX "public"."Thread_lastMessageAt_idx";

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "teamId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EventLog" ADD COLUMN     "teamId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "teamId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "teamId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Thread" ADD COLUMN     "teamId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "teamId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contact_teamId_idx" ON "Contact"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_teamId_phone_key" ON "Contact"("teamId", "phone");

-- CreateIndex
CREATE INDEX "EventLog_teamId_type_createdAt_idx" ON "EventLog"("teamId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Message_teamId_status_scheduledAt_idx" ON "Message"("teamId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "Note_teamId_threadId_idx" ON "Note"("teamId", "threadId");

-- CreateIndex
CREATE INDEX "Note_threadId_createdAt_idx" ON "Note"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "Thread_teamId_lastMessageAt_idx" ON "Thread"("teamId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Thread_teamId_channel_idx" ON "Thread"("teamId", "channel");

-- CreateIndex
CREATE INDEX "Thread_teamId_ownerId_idx" ON "Thread"("teamId", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Thread_teamId_contactId_channel_key" ON "Thread"("teamId", "contactId", "channel");

-- CreateIndex
CREATE INDEX "user_teamId_idx" ON "user"("teamId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventLog" ADD CONSTRAINT "EventLog_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "verification_token_key" RENAME TO "verification_value_key";
