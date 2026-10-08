-- CreateTable
CREATE TABLE "AppointmentCall" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'started',
    "result" TEXT,
    "digits" TEXT,
    "providerSid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppointmentCall_appointmentId_createdAt_idx" ON "AppointmentCall"("appointmentId", "createdAt");

-- AddForeignKey
ALTER TABLE "AppointmentCall" ADD CONSTRAINT "AppointmentCall_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

