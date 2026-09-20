import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/session";

/** Comparación en tiempo constante, para no filtrar la contraseña a cronómetro. */
function equals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request) {
  try {
    const expected = process.env.ADMIN_PASSWORD;

    // Falla cerrado. Antes esto comparaba `undefined !== undefined`, así que sin
    // la variable configurada un POST vacío entraba al panel.
    if (!expected || !process.env.ADMIN_SESSION_TOKEN) {
      console.error("ADMIN_PASSWORD o ADMIN_SESSION_TOKEN no están configurados");
      return NextResponse.json(
        { error: "El acceso no está configurado en el servidor" },
        { status: 503 },
      );
    }

    const limit = rateLimit(`auth:${clientKey(request)}`);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera un momento." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const { password } = await request.json();

    if (typeof password !== "string" || !equals(password, expected)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
