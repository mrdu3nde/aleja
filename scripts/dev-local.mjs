/**
 * `npm run dev:local` — el sitio en localhost contra la base LOCAL de
 * `prisma dev`, no contra la de producción.
 *
 * `next dev` a secas usa DATABASE_URL de .env.local, que es la base real: ahí
 * cualquier prueba cambia aluhstudio.com al instante. Next no pisa variables
 * que ya vienen en el entorno, así que basta con pasarla aquí.
 *
 * La primera vez:  npx prisma dev --name aluh-local --detach
 */
import { spawn } from "node:child_process";

const LOCAL = "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";
const port = process.argv[2] ?? "3000";

spawn("npx", ["next", "dev", "-p", port], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: LOCAL },
}).on("exit", (code) => process.exit(code ?? 0));
