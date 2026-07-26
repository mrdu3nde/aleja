-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "imageUrl" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");
CREATE INDEX "Service_active_sortOrder_idx" ON "Service"("active", "sortOrder");

-- Seed the six services the studio already offers, carrying over any price that
-- was set in Content so nothing is lost.
INSERT INTO "Service" ("id", "slug", "name", "icon", "sortOrder", "price", "updatedAt")
VALUES
  (gen_random_uuid(), 'hair',    'Hair Services',      'Scissors', 0, NULL, NOW()),
  (gen_random_uuid(), 'nails',   'Nail Services',      'Palette',  1, NULL, NOW()),
  (gen_random_uuid(), 'brows',   'Brow Services',      'Eye',      2, NULL, NOW()),
  (gen_random_uuid(), 'lashes',  'Lash Services',      'Sparkles', 3, NULL, NOW()),
  (gen_random_uuid(), 'facial',  'Facial Treatments',  'Droplets', 4, NULL, NOW()),
  (gen_random_uuid(), 'special', 'Special Services',   'Crown',    5, NULL, NOW());

UPDATE "Service" s
SET "price" = NULLIF(c."value", '')::DECIMAL(10,2)
FROM "Content" c
WHERE c."key" = 'service_price.' || s."slug"
  AND c."locale" = 'en'
  AND c."value" ~ '^[0-9]+(\.[0-9]+)?$'
  AND NULLIF(c."value", '')::DECIMAL(10,2) > 0;
