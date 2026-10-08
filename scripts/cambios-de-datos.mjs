/**
 * Los cambios de DATOS del rediseño de octubre 2026 (rama `rediseno-marca`).
 *
 * El código nuevo trae los textos y la estructura, pero la base guarda filas
 * viejas que los tapan (p. ej. `trust.title` = "Why Choose Aluh" en inglés) y
 * los servicios viven en la tabla `Service`. Esto los deja como pide ella.
 *
 * La base local y la de producción son distintas a propósito: se ensaya en la
 * local (`prisma dev`) y, sólo cuando el dueño aprueba, se corre en producción.
 *
 *   node scripts/cambios-de-datos.mjs --local
 *   node scripts/cambios-de-datos.mjs --produccion --si
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

// Filas de Content que guardaban los textos viejos. Sin ellas se ven los del
// código, que son los que ella aprobó. Siguen siendo editables desde el panel.
const STALE_CONTENT = [
  "hero.headline",
  "hero.subheadline",
  "trust.title",
  "trust.personalized",
  "trust.personalized_desc",
  "trust.quality",
  "trust.quality_desc",
  "trust.results",
  "trust.results_desc",
  "trust.experience",
  "trust.experience_desc",
  "about_page.title",
  "about_page.intro",
  "about_page.philosophy",
  "about_page.story",
  "about_page.commitment",
  "about_preview.title",
  "about_preview.text",
  "services_section.hair.description",
  "services_section.nails.title",
  "services_section.nails.description",
];

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query("BEGIN");

  const del = await client.query(`DELETE FROM "Content" WHERE key = ANY($1)`, [STALE_CONTENT]);
  console.log(`Textos viejos quitados: ${del.rowCount}`);

  // Ella pidió eliminar uñas. Se desactiva en vez de borrar: las citas viejas
  // guardan el nombre y así no queda nada huérfano.
  const nails = await client.query(`UPDATE "Service" SET active = false, "updatedAt" = now() WHERE slug = 'nails' AND active`);
  console.log(`Uñas desactivado: ${nails.rowCount}`);

  // Cabello ya no tiene un precio único ($35 a $350+). Sin precio fijo, cada
  // cita lleva el precio que ella ponga, en vez de $250 para todo.
  const hair = await client.query(`UPDATE "Service" SET price = NULL, "updatedAt" = now() WHERE slug = 'hair' AND price IS NOT NULL`);
  console.log(`Cabello sin precio fijo: ${hair.rowCount}`);

  await client.query("COMMIT");
  console.log(`Listo (${url === LOCAL ? "base LOCAL" : "PRODUCCIÓN"}).`);
} catch (err) {
  await client.query("ROLLBACK");
  console.error("No se cambió nada:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
