-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "depositAmount" DECIMAL(10,2) DEFAULT 20.00,
ADD COLUMN     "depositReceivedAt" TIMESTAMP(3),
ADD COLUMN     "depositRequired" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "depositStatus" TEXT NOT NULL DEFAULT 'pending';
