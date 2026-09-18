import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/** Lo único del panel que se puede abrir sin haber entrado. */
const PUBLIC_STUDIO_PATHS = ["/studio/login", "/api/studio/auth"];

function hasSession(request: NextRequest) {
  const token = process.env.ADMIN_SESSION_TOKEN;
  // Sin token configurado no hay forma de validar nada, y dejar pasar a todo el
  // mundo sería peor: se bloquea y se ve en los logs.
  if (!token) return false;
  return request.cookies.get("admin_session")?.value === token;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isStudio = pathname.startsWith("/studio") || pathname.startsWith("/api/studio");
  const isPublicStudio = PUBLIC_STUDIO_PATHS.some((p) => pathname.startsWith(p));

  if (isStudio && !isPublicStudio && !hasSession(request)) {
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
