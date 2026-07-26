-- Appointment: time + share-to-confirm flow
ALTER TABLE "Appointment" ADD COLUMN "preferredTime" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "shareToken" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "sharedAt" TIMESTAMP(3);
ALTER TABLE "Appointment" ADD COLUMN "clientConfirmedAt" TIMESTAMP(3);
ALTER TABLE "Appointment" ADD COLUMN "confirmationSeen" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Appointment_shareToken_key" ON "Appointment"("shareToken");

-- Client.email becomes optional (owner may only have a phone number)
ALTER TABLE "Client" ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
