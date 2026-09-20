import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { CHALLENGE_COOKIE, challengeCookieOptions, relyingParty } from "@/lib/webauthn";

/** Paso 2 de registrar un dispositivo: guardamos solo la llave pública. */
export async function POST(request: NextRequest) {
  try {
    const challenge = request.cookies.get(CHALLENGE_COOKIE)?.value;
    if (!challenge) {
      return NextResponse.json(
        { error: "El registro tardó demasiado. Inténtalo de nuevo." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const deviceName: string =
      typeof body?.deviceName === "string" && body.deviceName.trim()
        ? body.deviceName.trim().slice(0, 60)
        : "Mi dispositivo";

    const { rpID, origin } = relyingParty(request);

    // Igual que al entrar: un registro que no cuadra es culpa de la respuesta
    // del dispositivo, no del servidor. 400, no 500.
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: body.response,
        expectedChallenge: challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        // Sin esto, un dispositivo podría registrarse sin pedirle la cara a nadie.
        requireUserVerification: true,
      });
    } catch {
      return NextResponse.json({ error: "No se pudo verificar el dispositivo" }, { status: 400 });
    }

    if (!verification.verified) {
      return NextResponse.json({ error: "No se pudo verificar el dispositivo" }, { status: 400 });
    }

    const { credential, credentialBackedUp } = verification.registrationInfo;

    await prisma.credential.create({
      data: {
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        transports: credential.transports ? JSON.stringify(credential.transports) : null,
        deviceName,
        backedUp: credentialBackedUp,
      },
    });

    const response = NextResponse.json({ success: true, deviceName });
    // El reto es de un solo uso.
    response.cookies.set(CHALLENGE_COOKIE, "", challengeCookieOptions(0));
    return response;
  } catch (error) {
    console.error("passkey register verify", error);
    return NextResponse.json({ error: "No se pudo guardar el dispositivo" }, { status: 500 });
  }
}
