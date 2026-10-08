-- CreateTable
CREATE TABLE "UpdateView" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "device" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpdateView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourRun" (
    "id" TEXT NOT NULL,
    "device" TEXT,
    "lastStep" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UpdateView_releaseId_createdAt_idx" ON "UpdateView"("releaseId", "createdAt");

