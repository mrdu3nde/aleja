import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/session";
import {
  CHALLENGE_COOKIE,
  challengeCookieOptions,
  parseTransports,
  relyingParty,
} from "@/lib/webauthn";

/** Paso 2: la firma del teléfono vale por la contraseña. */
export async function POST(request: NextRequest) {
  try {
    const challenge = request.cookies.get(CHALLENGE_COOKIE)?.value;
    if (!challenge) {
      return NextResponse.json(
        { error: "El acceso tardó demasiado. Inténtalo de nuevo." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const credentialId: unknown = body?.response?.id;
    if (typeof credentialId !== "string") {
      return NextResponse.json({ error: "Respuesta inválida" }, { status: 400 });
    }

    const stored = await prisma.credential.findUnique({ where: { credentialId } });
    if (!stored) {
      return NextResponse.json({ error: "Ese dispositivo no está registrado" }, { status: 401 });
    }

    const { rpID, origin } = relyingParty(request);

    // La verificación lanza cuando la firma no cuadra, el reto no es el que se
    // emitió o el origen no coincide. Todo eso es "no eres tú" (401), no un
    // fallo del servidor: se aísla para no confundirlo con un 500 de verdad.
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: body.response,
        expectedChallenge: challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: stored.credentialId,
          publicKey: new Uint8Array(stored.publicKey),
          counter: Number(stored.counter),
          transports: parseTransports(stored.transports),
        },
        requireUserVerification: true,
      });
    } catch {
      return NextResponse.json({ error: "No se pudo verificar" }, { status: 401 });
    }

    if (!verification.verified) {
      return NextResponse.json({ error: "No se pudo verificar" }, { status: 401 });
    }

    await prisma.credential.update({
      where: { id: stored.id },
      data: {
        // El contador solo sube: si un clon reenvía una firma vieja, se nota.
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions());
    response.cookies.set(CHALLENGE_COOKIE, "", challengeCookieOptions(0));
    return response;
  } catch (error) {
    console.error("passkey login verify", error);
    return NextResponse.json({ error: "No se pudo entrar" }, { status: 500 });
  }
}
