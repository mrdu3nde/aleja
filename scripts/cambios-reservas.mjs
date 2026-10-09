/**
 * Los cambios de DATOS de la nota "Cambios completos para el website" (9 oct 2026).
 *
 * - Horario: lunes a viernes de 10:00 a 17:00, sábado de 10:00 a 14:00,
 *   domingo cerrado. Sigue siendo editable desde Disponibilidad.
 * - Las categorías con nombre en español: "Hair Services" salía tal cual en
 *   los mensajes de WhatsApp de una clienta que habla español.
 * - Pestañas y cejas ya no tienen un precio único (van de $25 a $120), así que
 *   como cabello, la cita que ella crea a mano lleva el precio que ponga.
 * - El texto viejo de cejas en inglés ("microblading") que tapaba el nuevo.
 *
 * Se ensaya en la local (`prisma dev`) y, sólo cuando el dueño aprueba, se
 * corre en producción:
 *
 *   node scripts/cambios-reservas.mjs --local
 *   node scripts/cambios-reservas.mjs --produccion --si
 *
 * Es idempotente: correrlo dos veces deja lo mismo.
 */
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

const LOCAL = "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";
const args = process.argv.slice(2);

let url;
if (args.includes("--local")) url = LOCAL;
else if (args.includes("--produccion") && args.includes("--si")) url = process.env.DATABASE_URL;
else {
  console.error("Uso: --local  |  --produccion --si");
  process.exit(1);
}

// 0 = domingo … 6 = sábado. Minutos desde la medianoche.
const HOURS = [
  { day: 0, start: 600, end: 840, active: false },
  { day: 1, start: 600, end: 1020, active: true },
  { day: 2, start: 600, end: 1020, active: true },
  { day: 3, start: 600, end: 1020, active: true },
  { day: 4, start: 600, end: 1020, active: true },
  { day: 5, start: 600, end: 1020, active: true },
  { day: 6, start: 600, end: 840, active: true },
];

const NAMES = {
  hair: "Cabello",
  brows: "Cejas",
  lashes: "Pestañas",
  facial: "Tratamientos Faciales",
  special: "Servicios Especiales",
  nails: "Uñas",
};

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query("BEGIN");

  for (const h of HOURS) {
    await client.query(
      `INSERT INTO "Availability" (id, "dayOfWeek", "startMinutes", "endMinutes", active)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4)
       ON CONFLICT ("dayOfWeek") DO UPDATE
       SET "startMinutes" = $2, "endMinutes" = $3, active = $4`,
      [h.day, h.start, h.end, h.active],
    );
  }
  console.log("Horario: L-V 10:00-17:00, sábado 10:00-14:00, domingo cerrado");

  let renamed = 0;
  for (const [slug, name] of Object.entries(NAMES)) {
    const r = await client.query(
      `UPDATE "Service" SET name = $2, "updatedAt" = now() WHERE slug = $1 AND name <> $2`,
      [slug, name],
    );
    renamed += r.rowCount;
  }
  console.log(`Categorías en español: ${renamed}`);

  const prices = await client.query(
    `UPDATE "Service" SET price = NULL, "updatedAt" = now() WHERE slug IN ('lashes', 'brows') AND price IS NOT NULL`,
  );
  console.log(`Pestañas y cejas sin precio único: ${prices.rowCount}`);

  const stale = await client.query(
    `DELETE FROM "Content" WHERE key = ANY($1)`,
    [["services_section.brows.description", "services_section.lashes.description"]],
  );
  console.log(`Textos viejos quitados: ${stale.rowCount}`);

  await client.query("COMMIT");
  console.log(`Listo (${url === LOCAL ? "base LOCAL" : "PRODUCCIÓN"}).`);
} catch (err) {
  await client.query("ROLLBACK");
  console.error("No se cambió nada:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
