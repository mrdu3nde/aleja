/**
 * Trae a la terminal las mejoras que Alejandra pidió desde el panel.
 *
 * Este es el otro extremo del círculo: ella dicta lo que quiere que cambie, el
 * modelo lo pasa a texto, y aquí se lee para implementarlo. Cuando queda hecho
 * se marca desde aquí, con una explicación que ella ve en su panel.
 *
 *   npm run notes                      las pendientes
 *   npm run notes -- --all             todas, incluidas las resueltas
 *   npm run notes -- --id <uuid>       una sola, con su conversación
 *   npm run notes -- --done <uuid> "qué se hizo"
 *   npm run notes -- --ask  <uuid> "qué necesito saber"
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
const askId = flag("--ask");

/** El mensaje es el argumento que sigue al uuid. */
const messageFor = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : (args[i + 2] ?? null);
};

const STATUS_LABEL = {
  new: "NUEVA",
  read: "LEIDA",
  needs_info: "FALTA INFO",
  done: "RESUELTA",
};

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL. ¿Existe .env.local?");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const fmt = (date) =>
  new Date(date).toLocaleString("es", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

async function printThread(noteId, indent = "    ") {
  const { rows } = await client.query(
    `SELECT "author", "body", "createdAt" FROM "NoteMessage"
      WHERE "noteId" = $1 ORDER BY "createdAt" ASC`,
    [noteId],
  );
  if (rows.length === 0) return;
  console.log(`${indent}--- conversación ---`);
  for (const m of rows) {
    const who = m.author === "claude" ? "yo " : "ELLA";
    console.log(`${indent}[${who}] ${fmt(m.createdAt)}`);
    for (const line of m.body.split("\n")) console.log(`${indent}  ${line}`);
  }
}

try {
  if (typeof doneId === "string") {
    const note = messageFor("--done");
    if (!note) {
      console.error('Falta la explicación. Uso: npm run notes -- --done <uuid> "qué se hizo"');
      process.exit(1);
    }
    const { rowCount } = await client.query(
      `UPDATE "Note" SET "status" = 'done', "resolvedAt" = NOW(), "updatedAt" = NOW()
        WHERE "id" = $1`,
      [doneId],
    );
    if (!rowCount) {
      console.log("No existe esa nota.");
    } else {
      // La explicación queda en la conversación: ella abre la nota y ve qué se
      // hizo, en vez de solo un estado que cambió de color.
      await client.query(
        `INSERT INTO "NoteMessage" ("id", "noteId", "author", "body")
         VALUES (gen_random_uuid(), $1, 'claude', $2)`,
        [doneId, note],
      );
      console.log(`Nota ${doneId} marcada como resuelta, con tu explicación.`);
    }
  } else if (typeof askId === "string") {
    const question = messageFor("--ask");
    if (!question) {
      console.error('Falta la pregunta. Uso: npm run notes -- --ask <uuid> "qué necesito saber"');
      process.exit(1);
    }
    const { rowCount } = await client.query(
      `UPDATE "Note" SET "status" = 'needs_info', "updatedAt" = NOW() WHERE "id" = $1`,
      [askId],
    );
    if (!rowCount) {
      console.log("No existe esa nota.");
    } else {
      await client.query(
        `INSERT INTO "NoteMessage" ("id", "noteId", "author", "body")
         VALUES (gen_random_uuid(), $1, 'claude', $2)`,
        [askId, question],
      );
      console.log(`Pregunta enviada. Ella la verá en la nota ${askId}.`);
    }
  } else {
    const where =
      typeof onlyId === "string"
        ? { clause: `WHERE "id" = $1`, params: [onlyId] }
        : showAll
          ? { clause: "", params: [] }
          : { clause: `WHERE "status" <> 'done'`, params: [] };

    const { rows } = await client.query(
      `SELECT "id", "title", "transcript", "editedText", "source", "status",
              "aiStatus", "aiError", "imageUrl", "imageData" IS NOT NULL AS "hasPhoto",
              "resolvedAt", "createdAt"
         FROM "Note" ${where.clause}
        ORDER BY "createdAt" DESC`,
      where.params,
    );

    if (rows.length === 0) {
      console.log(
        showAll || onlyId ? "No hay notas." : "No hay mejoras pendientes. Todo al día.",
      );
    }

    for (const note of rows) {
      const text = (note.editedText ?? "").trim() || (note.transcript ?? "").trim();
      console.log("");
      console.log("=".repeat(72));
      console.log(`  ${note.title ?? "Sin título"}   [${STATUS_LABEL[note.status] ?? note.status}]`);
      console.log(`  id: ${note.id}`);
      console.log(
        `  ${note.source === "text" ? "escrita" : "dictada"} el ${fmt(note.createdAt)}` +
          (note.resolvedAt ? `  ·  resuelta el ${fmt(note.resolvedAt)}` : ""),
      );
      if (note.imageUrl || note.hasPhoto) {
        console.log(`  foto adjunta: ${note.imageUrl ?? "(guardada en la base)"}`);
      }
      if (note.aiStatus === "failed") {
        console.log(`  !! la transcripción falló: ${note.aiError ?? "sin motivo"}`);
      }
      console.log("-".repeat(72));
      for (const line of (text || "(sin texto)").split("\n")) console.log(`    ${line}`);
      await printThread(note.id);
    }

    if (rows.length > 0) {
      console.log("");
      console.log("=".repeat(72));
      console.log('  Resolver:  npm run notes -- --done <id> "qué se hizo"');
      console.log('  Preguntar: npm run notes -- --ask  <id> "qué necesito saber"');
    }
  }
} finally {
  await client.end();
}
