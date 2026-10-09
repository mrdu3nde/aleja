/**
 * Copia los datos de PRODUCCIÓN a la base LOCAL (`prisma dev`), para ver en
 * localhost lo mismo que ella ve: sus notas de Mejoras, citas, clientas,
 * galería, textos.
 *
 * Sólo LEE de producción. En la local borra las tablas que copia y las vuelve
 * a llenar, así que lo que hayas probado en local se pierde.
 *
 * No copia a propósito:
 * - PushSubscription: con ellas, una prueba en local le mandaría avisos a su
 *   teléfono de verdad.
 * - Credential: los passkeys están atados a aluhstudio.com y no sirven en
 *   localhost. En local se entra con la contraseña del panel.
 *
 *   node scripts/copiar-produccion-a-local.mjs
 *
 * Después, para ver los cambios de una rama que aún no están en producción,
 * corre su script de datos con --local (p. ej. cambios-reservas.mjs --local).
 */
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

const LOCAL = "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";

// Padres antes que hijos, por las llaves foráneas.
const TABLES = [
  "Client",
  "Appointment",
  "Payment",
  "AppointmentCall",
  "ServiceRecord",
  "Service",
  "Content",
  "Availability",
  "BlockedDate",
  "Note",
  "NoteMessage",
  "GalleryPhoto",
  "UpdateView",
  "TourRun",
  "Review",
];

if (!process.env.DATABASE_URL || process.env.DATABASE_URL === LOCAL) {
  console.error("DATABASE_URL de producción no está en .env.local");
  process.exit(1);
}

const prod = new pg.Client({ connectionString: process.env.DATABASE_URL });
const local = new pg.Client({ connectionString: LOCAL });
await prod.connect();
await local.connect();

try {
  // Lo que existe en cada lado: producción puede ir atrás de la rama (p. ej.
  // sin la tabla Review todavía).
  const existing = async (c) =>
    new Set(
      (await c.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`)).rows.map(
        (r) => r.table_name,
      ),
    );
  const inProd = await existing(prod);
  const inLocal = await existing(local);

  await local.query("BEGIN");
  const targets = TABLES.filter((t) => inLocal.has(t));
  await local.query(`TRUNCATE ${targets.map((t) => `"${t}"`).join(", ")} CASCADE`);

  for (const table of targets) {
    if (!inProd.has(table)) {
      console.log(`${table}: no existe en producción, queda vacía`);
      continue;
    }
    const { rows } = await prod.query(`SELECT * FROM "${table}"`);
    for (const row of rows) {
      const cols = Object.keys(row);
      await local.query(
        `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")})`,
        cols.map((c) => row[c]),
      );
    }
    console.log(`${table}: ${rows.length}`);
  }

  await local.query("COMMIT");
  console.log("Listo: la base local tiene los datos de producción.");
} catch (err) {
  await local.query("ROLLBACK");
  console.error("No se cambió nada en local:", err.message);
  process.exitCode = 1;
} finally {
  await prod.end();
  await local.end();
}
