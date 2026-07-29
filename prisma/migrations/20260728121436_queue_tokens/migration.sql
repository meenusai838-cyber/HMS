-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'DONE', 'SKIPPED');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "checkedInAt" TIMESTAMP(3),
ADD COLUMN     "isWalkIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "queueStatus" "QueueStatus",
ADD COLUMN     "tokenNumber" INTEGER;

-- CreateIndex
CREATE INDEX "Appointment_doctorId_checkedInAt_idx" ON "Appointment"("doctorId", "checkedInAt");
