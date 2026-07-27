-- How long each service occupies the chair
ALTER TABLE "Service" ADD COLUMN "durationMinutes" INTEGER NOT NULL DEFAULT 60;

-- Snapshot on the appointment so later edits to a service never rewrite history
ALTER TABLE "Appointment" ADD COLUMN "durationMinutes" INTEGER;

-- Recurring weekly hours, in minutes from midnight
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Availability_dayOfWeek_key" ON "Availability"("dayOfWeek");

-- Single days off that override the weekly hours
CREATE TABLE "BlockedDate" (
    "date" TEXT NOT NULL,
    "reason" TEXT,

    CONSTRAINT "BlockedDate_pkey" PRIMARY KEY ("date")
);

-- A sensible starting week: Monday to Saturday 9:00-18:00, Sunday closed.
INSERT INTO "Availability" ("id", "dayOfWeek", "startMinutes", "endMinutes", "active") VALUES
  (gen_random_uuid(), 0, 540, 1080, false),
  (gen_random_uuid(), 1, 540, 1080, true),
  (gen_random_uuid(), 2, 540, 1080, true),
  (gen_random_uuid(), 3, 540, 1080, true),
  (gen_random_uuid(), 4, 540, 1080, true),
  (gen_random_uuid(), 5, 540, 1080, true),
  (gen_random_uuid(), 6, 540, 1080, true);

-- Backfill existing appointments with their service's duration
UPDATE "Appointment" a
SET "durationMinutes" = s."durationMinutes"
FROM "Service" s
WHERE a."service" = s."name" AND a."durationMinutes" IS NULL;
