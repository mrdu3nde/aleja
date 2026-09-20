import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE, verifySessionToken } from "./lib/session";

const intlMiddleware = createMiddleware(routing);

/**
 * Lo único del panel que se puede abrir sin haber entrado.
 *
 * La comparación es exacta, no `startsWith`. Con `startsWith` una ruta nueva
 * como /api/studio/auth/passkey/register quedaría abierta sin querer, y
 * registrar un dispositivo nuevo es justo lo que no puede ser público.
 */
const PUBLIC_STUDIO_PATHS = new Set([
  "/studio/login",
  "/api/studio/auth",
  "/api/studio/auth/logout",
  "/api/studio/auth/passkey/login/options",
  "/api/studio/auth/passkey/login/verify",
]);

async function hasSession(request: NextRequest) {
  // Sin secreto configurado no hay forma de validar nada, y dejar pasar a todo
  // el mundo sería peor: se bloquea y se ve en los logs.
  if (!process.env.ADMIN_SESSION_TOKEN) return false;
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isStudio = pathname.startsWith("/studio") || pathname.startsWith("/api/studio");
  const isPublicStudio = PUBLIC_STUDIO_PATHS.has(pathname);

  if (isStudio && !isPublicStudio && !(await hasSession(request))) {
    // La API responde 401 en vez de redirigir: un fetch que recibe el HTML del
    // login no tiene forma de saber que la sesión se venció.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const login = new URL("/studio/login", request.url);
    return NextResponse.redirect(login);
  }

  // Studio autenticado, resto de la API y los enlaces públicos de confirmación
  if (isStudio || pathname.startsWith("/api") || pathname.startsWith("/confirm")) {
    return NextResponse.next();
  }

  // Everything else: i18n middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
