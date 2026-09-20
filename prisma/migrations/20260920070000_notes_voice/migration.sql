-- Las notas dejan de ser "una foto de un papel" y pasan a ser pedidos de mejora
-- dictados por voz. El audio no se guarda: se transcribe al vuelo y se descarta,
-- así que estos campos hablan de "ai" y ya no de "ocr".
ALTER TABLE "Note" RENAME COLUMN "ocrStatus" TO "aiStatus";
ALTER TABLE "Note" RENAME COLUMN "ocrError" TO "aiError";
ALTER TABLE "Note" RENAME COLUMN "ocrModel" TO "aiModel";

-- Las notas que ya existieran vinieron de una foto, no de la voz.
ALTER TABLE "Note" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'voice';
UPDATE "Note" SET "source" = 'photo';

ALTER TABLE "Note" ADD COLUMN "resolvedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "NoteMessage" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NoteMessage_noteId_createdAt_idx" ON "NoteMessage"("noteId", "createdAt");

-- AddForeignKey
ALTER TABLE "NoteMessage" ADD CONSTRAINT "NoteMessage_noteId_fkey"
    FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
