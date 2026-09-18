-- Notas manuscritas: foto + transcripción del modelo de visión.
-- `transcript` guarda lo que leyó el modelo y `editedText` la corrección de
-- ella, por separado, para no perder nunca lo que decía el papel.
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageData" TEXT,
    "title" TEXT,
    "transcript" TEXT,
    "editedText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "ocrStatus" TEXT NOT NULL DEFAULT 'pending',
    "ocrError" TEXT,
    "ocrModel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- El listado siempre pide por estado y ordena por fecha.
CREATE INDEX "Note_status_createdAt_idx" ON "Note"("status", "createdAt");
