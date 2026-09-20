/**
 * Sesiones del panel: cookie firmada, con vencimiento propio.
 *
 * Antes la cookie guardaba `ADMIN_SESSION_TOKEN` tal cual, así que era el mismo
 * valor para siempre: si se filtraba una vez, servía de por vida y no había
 * manera de cortarla sin cambiar la variable de entorno. Ahora cada inicio de
 * sesión acuña un token distinto que caduca solo, y rotar la variable invalida
 * todos los que existan.
 *
 * Usa Web Crypto (no `node:crypto`) porque esto también corre dentro de
 * `proxy.ts`, y así el mismo código vale en cualquier runtime.
 */

export const SESSION_COOKIE = "admin_session";

/** 30 días: ella entra desde su teléfono y no queremos pedirle la cara a diario. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

function secret(): string {
  const value = process.env.ADMIN_SESSION_TOKEN;
  if (!value) {
    throw new Error("ADMIN_SESSION_TOKEN no está configurado");
  }
  return value;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

/** Comparación en tiempo constante: no filtra la firma a fuerza de cronómetro. */
function equals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(maxAgeSeconds = SESSION_MAX_AGE): Promise<string> {
  const expiresAt = Date.now() + maxAgeSeconds * 1000;
  const nonce = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const payload = `${expiresAt}.${nonce}`;
  return `v1.${payload}.${await sign(payload)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;

  const [, expiresAt, nonce, signature] = parts;

  // La firma primero: si no es nuestra, el vencimiento da igual.
  if (!equals(signature, await sign(`${expiresAt}.${nonce}`))) return false;

  const expiry = Number(expiresAt);
  return Number.isFinite(expiry) && expiry > Date.now();
}

export function sessionCookieOptions(maxAgeSeconds = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
