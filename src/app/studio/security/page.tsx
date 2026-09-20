"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck,
  Fingerprint,
  Trash2,
  AlertCircle,
  CheckCircle,
  Smartphone,
} from "lucide-react";
import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startRegistration,
} from "@simplewebauthn/browser";

type Credential = {
  id: string;
  deviceName: string;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

const card = {
  backgroundColor: "var(--admin-card)",
  border: "1px solid var(--admin-border)",
};

function formatDate(value: string | null) {
  if (!value) return "nunca";
  return new Date(value).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Un nombre que ella reconozca, adivinado del equipo desde el que registra. */
function guessDeviceName(): string {
  if (typeof navigator === "undefined") return "Mi dispositivo";
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Macintosh/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  return "Mi dispositivo";
}

export default function SecurityPage() {
  const [credentials, setCredentials] = useState<Credential[] | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [supported, setSupported] = useState<boolean | null>(null);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/studio/passkeys");
      if (!res.ok) {
        setError(
          res.status === 401
            ? "Tu sesión venció. Vuelve a entrar."
            : "No se pudieron cargar los dispositivos",
        );
        setCredentials([]);
        return;
      }
      const data = await res.json();
      setCredentials(data.credentials ?? []);
    } catch {
      setError("No se pudieron cargar los dispositivos");
      setCredentials([]);
    }
  }, []);

  useEffect(() => {
    // `isSecureContext` descarta el caso de probar por la IP de la red local,
    // donde la biometría nunca va a aparecer por más que el navegador la soporte.
    const available =
      browserSupportsWebAuthn() && window.isSecureContext
        ? platformAuthenticatorIsAvailable()
        : Promise.resolve(false);

    available
      .catch(() => false)
      .then((ok) => {
        setSupported(ok);
        setDeviceName(guessDeviceName());
      });

    fetch("/api/studio/passkeys")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => setCredentials(data.credentials ?? []))
      .catch((status) => {
        setError(
          status === 401
            ? "Tu sesión venció. Vuelve a entrar."
            : "No se pudieron cargar los dispositivos",
        );
        setCredentials([]);
      });
  }, []);

  const register = async () => {
    setError("");
    setSaved("");
    setRegistering(true);

    try {
      const optionsRes = await fetch("/api/studio/auth/passkey/register/options", {
        method: "POST",
      });
      if (!optionsRes.ok) {
        setError(
          optionsRes.status === 401
            ? "Tu sesión venció. Vuelve a entrar."
            : "No se pudo iniciar el registro",
        );
        setRegistering(false);
        return;
      }

      const response = await startRegistration({ optionsJSON: await optionsRes.json() });

      const verifyRes = await fetch("/api/studio/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response, deviceName: deviceName.trim() || guessDeviceName() }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json().catch(() => ({}));
        setError(data.error || "No se pudo guardar el dispositivo");
        setRegistering(false);
        return;
      }

      setSaved("Listo. Ya puedes entrar con este dispositivo.");
      setRegistering(false);
      load();
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "InvalidStateError") {
        setError("Este dispositivo ya está registrado.");
      } else if (name !== "NotAllowedError" && name !== "AbortError") {
        setError("Este dispositivo no pudo registrarse");
      }
      setRegistering(false);
    }
  };

  const remove = async (id: string) => {
    setError("");
    setSaved("");
    try {
      const res = await fetch("/api/studio/passkeys/" + id, { method: "DELETE" });
      if (!res.ok) {
        setError("No se pudo quitar el dispositivo");
        return;
      }
      setSaved("Dispositivo eliminado.");
      load();
    } catch {
      setError("No se pudo quitar el dispositivo");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: "var(--admin-text)" }}
        >
          <ShieldCheck className="h-6 w-6" />
          Seguridad
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--admin-muted)" }}>
          Entra al panel con tu huella o tu cara, sin escribir la contraseña.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-sm mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-xl text-sm mb-4">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {saved}
        </div>
      )}

      <div className="rounded-2xl p-5 mb-5" style={card}>
        <h2 className="text-base font-semibold mb-2" style={{ color: "var(--admin-text)" }}>
          Registrar este dispositivo
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--admin-muted)" }}>
          Tu huella y tu cara nunca salen de tu teléfono: aquí solo se guarda una
          llave que las comprueba. Registra cada equipo desde el que quieras entrar.
        </p>

        {supported === false ? (
          <div
            className="rounded-xl p-4 text-sm"
            style={{ backgroundColor: "var(--admin-filter-bg)", color: "var(--admin-muted)" }}
          >
            Este equipo no ofrece huella ni reconocimiento facial para sitios web.
            Abre el panel desde tu teléfono, en{" "}
            <strong>https://aluhstudio.com/studio</strong>, y regístralo ahí.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="Nombre del dispositivo"
              maxLength={60}
              className="flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{
                backgroundColor: "var(--admin-input)",
                border: "1px solid var(--admin-input-border)",
                color: "var(--admin-text)",
              }}
            />
            <button
              onClick={register}
              disabled={registering || supported === null}
              className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: "#6B4E3D", color: "#ffffff" }}
            >
              <Fingerprint className="h-4 w-4" />
              {registering ? "Esperando..." : "Registrar"}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl p-5" style={card}>
        <h2 className="text-base font-semibold mb-4" style={{ color: "var(--admin-text)" }}>
          Dispositivos registrados
        </h2>

        {credentials === null ? (
          <p className="text-sm" style={{ color: "var(--admin-muted)" }}>
            Cargando...
          </p>
        ) : credentials.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--admin-muted)" }}>
            Todavía no hay ninguno. Mientras tanto se entra con la contraseña.
          </p>
        ) : (
          <ul className="space-y-3">
            {credentials.map((credential) => (
              <li
                key={credential.id}
                className="flex items-center justify-between gap-3 rounded-xl p-3"
                style={{ backgroundColor: "var(--admin-filter-bg)" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Smartphone
                    className="h-5 w-5 shrink-0"
                    style={{ color: "var(--admin-muted)" }}
                  />
                  <div className="min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--admin-text)" }}
                    >
                      {credential.deviceName}
                    </p>
                    <p className="text-xs" style={{ color: "var(--admin-muted)" }}>
                      Registrado el {formatDate(credential.createdAt)} · Último uso:{" "}
                      {formatDate(credential.lastUsedAt)}
                      {credential.backedUp && " · se sincroniza con tus otros equipos"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => remove(credential.id)}
                  aria-label={"Quitar " + credential.deviceName}
                  className="shrink-0 rounded-lg p-2 transition-colors cursor-pointer"
                  style={{ color: "#b91c1c" }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs mt-5" style={{ color: "var(--admin-muted)" }}>
        La contraseña sigue funcionando siempre. Si cambias de teléfono, entra con
        ella y registra el nuevo desde aquí.
      </p>
    </div>
  );
}
