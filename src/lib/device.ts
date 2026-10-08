import { cookies, headers } from "next/headers";
import { DEVICE_COOKIE } from "./session";

/** El tipo de equipo según el navegador, para sesiones sin nombre guardado. */
function deviceKind(userAgent: string): string | null {
  if (/iPhone/i.test(userAgent)) return "un iPhone";
  if (/iPad/i.test(userAgent)) return "un iPad";
  if (/Android/i.test(userAgent)) return "un Android";
  if (/Windows/i.test(userAgent)) return "una PC con Windows";
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "una Mac";
  return null;
}

/**
 * Con qué dispositivo se está usando el panel, para el historial de Novedades.
 *
 * Primero el nombre del passkey con el que se entró ("iPhone de Ale"); las
 * sesiones abiertas antes de existir eso (o con contraseña) caen al tipo de
 * equipo que reporta el navegador.
 */
export async function currentDevice(): Promise<string | null> {
  const raw = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (raw) {
    try {
      return decodeURIComponent(raw).slice(0, 80);
    } catch {
      // cookie dañada: se usa el tipo de equipo
    }
  }
  return deviceKind((await headers()).get("user-agent") ?? "");
}
