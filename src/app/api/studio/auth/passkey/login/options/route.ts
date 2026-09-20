import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import {
  CHALLENGE_COOKIE,
  challengeCookieOptions,
  parseTransports,
  relyingParty,
} from "@/lib/webauthn";

/**
 * Paso 1 de entrar con huella o cara. Es pública a propósito: todavía no hay
 * sesión. No revela nada: sin dispositivos registrados responde 404 y la
 * pantalla de login simplemente no muestra el botón.
 */
export async function POST(request: Request) {
  try {
    const credentials = await prisma.credential.findMany();
    if (credentials.length === 0) {
      return NextResponse.json({ error: "no_credentials" }, { status: 404 });
    }

    const { rpID } = relyingParty(request);

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map((credential) => ({
        id: credential.credentialId,
        transports: parseTransports(credential.transports),
      })),
      // Obliga a la biometría (o al PIN del equipo) en cada entrada. Es la
      // diferencia real con dejar la cookie viva: aquí sí se comprueba quién es.
      userVerification: "required",
    });

    const response = NextResponse.json(options);
    response.cookies.set(CHALLENGE_COOKIE, options.challenge, challengeCookieOptions());
    return response;
  } catch (error) {
    console.error("passkey login options", error);
    return NextResponse.json({ error: "No se pudo iniciar el acceso" }, { status: 500 });
  }
}
