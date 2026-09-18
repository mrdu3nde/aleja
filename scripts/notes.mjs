/**
 * Trae a la terminal las notas que Alejandra fotografió en el panel.
 *
 * Este es el otro extremo del círculo: ella escribe en papel, le toma una foto,
 * el modelo la pasa a texto, y aquí se lee para implementar lo que pidió.
 *
 *   npm run notes                 las nuevas y las leídas (lo pendiente)
 *   npm run notes -- --all        todas, incluidas las hechas
 *   npm run notes -- --id <uuid>  una sola, completa
 *   npm run notes -- --done <uuid>  marcarla como implementada
 *
 * Usa `pg` directamente en vez del cliente de Prisma para no depender de
 * `prisma generate` ni de compilar TypeScript. No escribe ningún archivo: el
 * texto del negocio no termina en el repo.
 */
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : (args[i + 1] ?? true);
};

const showAll = args.includes("--all");
const onlyId = flag("--id");
const doneId = flag("--done");

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL. ¿Existe .env.local?");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  if (typeof doneId === "string") {
    const { rowCount } = await client.query(
      `UPDATE "Note" SET "status" = 'done', "updatedAt" = NOW() WHERE "id" = $1`,
      [doneId],
    );
    console.log(rowCount ? `Nota ${doneId} marcada como hecha.` : "No existe esa nota.");
  } else {
    const where =
      typeof onlyId === "string"
        ? { clause: `WHERE "id" = $1`, params: [onlyId] }
        : showAll
          ? { clause: "", params: [] }
          : { clause: `WHERE "status" <> 'done'`, params: [] };

    const { rows } = await client.query(
      `SELECT "id", "title", "transcript", "editedText", "status", "ocrStatus",
              "ocrError", "imageUrl", "createdAt"
         FROM "Note" ${where.clause}
        ORDER BY "createdAt" DESC`,
      where.params,
    );

    if (rows.length === 0) {
      console.log(
        showAll || onlyId ? "No hay notas." : "No hay notas pendientes. Todo al día.",
      );
    }

    for (const note of rows) {
      // Su corrección manda sobre lo que leyó el modelo.
      const text = (note.editedText ?? "").trim() || (note.transcript ?? "").trim();
      const fecha = new Date(note.createdAt).toLocaleString("es-US");

      console.log("");
      console.log(`## ${note.title ?? "Nota sin título"} — ${fecha}`);
      console.log(`estado: ${note.status} · lectura: ${note.ocrStatus}` +
        (note.ocrError ? ` (${note.ocrError})` : ""));
      console.log(`id: ${note.id}`);
      if (note.imageUrl) console.log(`foto: ${note.imageUrl}`);
      console.log("");
      console.log(text || "(sin texto: la lectura falló y no se escribió a mano)");
      if (note.editedText && note.transcript && note.editedText.trim() !== note.transcript.trim()) {
        console.log("");
        console.log("<!-- lo que leyó el modelo antes de su corrección:");
        console.log(note.transcript);
        console.log("-->");
      }
      console.log("");
      console.log("---");
    }
  }
} finally {
  await client.end();
}
