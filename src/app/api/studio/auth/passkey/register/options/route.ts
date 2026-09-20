import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import {
  CHALLENGE_COOKIE,
  OWNER_ID,
  OWNER_NAME,
  challengeCookieOptions,
  parseTransports,
  relyingParty,
} from "@/lib/webauthn";

/**
 * Paso 1 de registrar un dispositivo. Protegida por `proxy.ts`: solo se llega
 * aquí con la sesión ya iniciada, así que registrar una llave nueva exige
 * haber entrado antes con la contraseña.
 */
export async function POST(request: Request) {
  try {
    const { rpID, rpName } = relyingParty(request);
    const existing = await prisma.credential.findMany();

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: OWNER_ID,
      userName: process.env.ADMIN_EMAIL || "aluh",
      userDisplayName: OWNER_NAME,
      attestationType: "none",
      // Evita registrar dos veces el mismo teléfono.
      excludeCredentials: existing.map((credential) => ({
        id: credential.credentialId,
        transports: parseTransports(credential.transports),
      })),
      authenticatorSelection: {
        // "preferred" y no "required": si un equipo viejo no sabe guardar la
        // llave de forma descubrible, igual se puede registrar.
        residentKey: "preferred",
        // Esto es lo que obliga a la huella, la cara o el PIN. Sin esto el
        // teléfono podría responder sin comprobar quién está del otro lado.
        userVerification: "required",
      },
    });

    const response = NextResponse.json(options);
    response.cookies.set(CHALLENGE_COOKIE, options.challenge, challengeCookieOptions());
    return response;
  } catch (error) {
    console.error("passkey register options", error);
    return NextResponse.json({ error: "No se pudo iniciar el registro" }, { status: 500 });
  }
}
