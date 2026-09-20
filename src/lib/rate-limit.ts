/**
 * Límite de intentos, en memoria.
 *
 * No es un candado perfecto: en serverless cada instancia lleva su propia
 * cuenta, así que alguien muy insistente podría repartir intentos entre varias.
 * Aun así corta en seco la fuerza bruta desde una sola IP, que es el caso real,
 * y no añade ninguna dependencia. Si algún día hace falta algo serio, esto se
 * cambia por Upstash Redis sin tocar quien lo llama.
 */

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

export function rateLimit(
  key: string,
  limit = 8,
  windowMs = 60_000,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();

  // Barrido perezoso: sin esto el mapa crecería para siempre.
  if (buckets.size > 500) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }

  const entry = buckets.get(key);
  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }

  return { ok: true, retryAfter: 0 };
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "desconocido";
}
