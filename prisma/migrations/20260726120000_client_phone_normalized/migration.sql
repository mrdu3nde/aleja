-- AlterTable
ALTER TABLE "Client" ADD COLUMN "phoneNormalized" TEXT;

-- Backfill existing rows: keep the last 10 digits of the stored phone.
UPDATE "Client"
SET "phoneNormalized" = RIGHT(REGEXP_REPLACE("phone", '\D', '', 'g'), 10)
WHERE "phone" IS NOT NULL
  AND LENGTH(REGEXP_REPLACE("phone", '\D', '', 'g')) >= 7;

-- CreateIndex
CREATE INDEX "Client_phoneNormalized_idx" ON "Client"("phoneNormalized");
