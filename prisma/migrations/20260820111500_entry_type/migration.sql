-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('INCIDENT', 'SERVICE');

-- AlterTable
ALTER TABLE "IncidentLog" ADD COLUMN "entryType" "EntryType" NOT NULL DEFAULT 'INCIDENT';

-- CreateIndex
CREATE INDEX "IncidentLog_entryType_createdAt_idx" ON "IncidentLog"("entryType", "createdAt");