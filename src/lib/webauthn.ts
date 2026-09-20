/**
 * Configuración compartida de los passkeys (WebAuthn).
 *
 * Un passkey queda amarrado al dominio donde se creó, así que el `rpID` sale
 * del propio request: en localhost vale "localhost" y en producción
 * "aluhstudio.com", sin variables de entorno que mantener sincronizadas.
 */

export const CHALLENGE_COOKIE = "webauthn_challenge";

/** El reto vive 5 minutos: lo suficiente para poner el dedo, no más. */
export const CHALLENGE_MAX_AGE = 60 * 5;

/** Identidad fija de la dueña. Es un panel de una sola usuaria: no hay cuentas. */
export const OWNER_ID = new TextEncoder().encode("aluh-owner");
export const OWNER_NAME = "Aluh";

export function relyingParty(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  // Detrás de Vercel el protocolo real llega en la cabecera; puede venir con
  // varios valores separados por coma y el primero es el del cliente.
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwarded ?? url.protocol.replace(":", "");

  const hostname = host.split(":")[0];

  // aluhstudio.com redirige a www.aluhstudio.com, y un passkey solo vale para
  // el dominio con el que se registró. Anclarlo al dominio raíz (WebAuthn
  // permite que el rpID sea un sufijo del origen) hace que la misma llave
  // sirva en los dos, y que siga sirviendo si mañana cambia esa redirección.
  const rpID = hostname.startsWith("www.") ? hostname.slice(4) : hostname;

  return {
    rpID,
    /** Origen completo, con puerto. Tiene que calzar exacto con el navegador. */
    origin: `${protocol}://${host}`,
    rpName: OWNER_NAME,
  };
}

export function challengeCookieOptions(maxAge = CHALLENGE_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** Los transportes se guardan como JSON; si vienen mal, se ignoran. */
export function parseTransports(value: string | null): string[] | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}
