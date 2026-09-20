"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock, AlertCircle, Fingerprint } from "lucide-react";
import {
  browserSupportsWebAuthn,
  startAuthentication,
} from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  // Las opciones se piden al cargar, no al tocar el botón: iOS exige que
  // `startAuthentication` salga del mismo gesto del dedo, sin un fetch en medio.
  const [passkeyOptions, setPasskeyOptions] =
    useState<PublicKeyCredentialRequestOptionsJSON | null>(null);

  /**
   * Entrar recargando la página entera, no con `router.push`.
   *
   * La sesión es una cookie que valida `proxy.ts` en el servidor, y `/studio`
   * es una página prerenderizada: el router del navegador ya tenía guardada la
   * versión de "no has entrado" (la que redirige al login), así que al navegar
   * del lado del cliente reusaba esa copia y se quedaba pegado. Encima el
   * `router.refresh()` que iba después competía con esa misma navegación.
   *
   * Con una carga completa el navegador manda la cookie recién puesta, el
   * proxy la valida y el servidor dibuja el panel limpio. Se entra una vez
   * cada treinta días: la recarga no le cuesta nada a nadie.
   */
  const enterStudio = () => {
    window.location.assign("/studio");
  };

  useEffect(() => {
    if (!browserSupportsWebAuthn()) return;
    fetch("/api/studio/auth/passkey/login/options", { method: "POST" })
      // 404 = todavía no hay ningún dispositivo registrado. El botón no aparece.
      .then((r) => (r.ok ? r.json() : null))
      .then(setPasskeyOptions)
      // Sin conexión no hay biometría; queda la contraseña.
      .catch(() => {});
  }, []);

  /** Tras un intento fallido el reto ya se gastó: hay que pedir uno nuevo. */
  const reloadPasskeyOptions = useCallback(() => {
    fetch("/api/studio/auth/passkey/login/options", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setPasskeyOptions)
      .catch(() => {});
  }, []);

  const handleBiometric = async () => {
    if (!passkeyOptions) return;
    setError("");
    setBiometricLoading(true);

    try {
      const response = await startAuthentication({ optionsJSON: passkeyOptions });

      const res = await fetch("/api/studio/auth/passkey/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo entrar con este dispositivo");
        setBiometricLoading(false);
        reloadPasskeyOptions();
        return;
      }

      enterStudio();
    } catch (err) {
      // Cancelar con el botón de atrás o el dedo equivocado cae aquí. No es un
      // error que valga la pena mostrar en rojo.
      const name = err instanceof Error ? err.name : "";
      if (name !== "NotAllowedError" && name !== "AbortError") {
        setError("Este dispositivo no pudo verificarte");
      }
      setBiometricLoading(false);
      reloadPasskeyOptions();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/studio/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          res.status === 429
            ? "Demasiados intentos. Espera un momento."
            : res.status === 503
              ? "El acceso no está configurado en el servidor"
              : data.error === "Invalid password"
                ? "Contraseña incorrecta"
                : "No se pudo entrar",
        );
        setLoading(false);
        return;
      }

      enterStudio();
    } catch {
      setError("Algo salió mal");
      setLoading(false);
    }
  };

  const busy = loading || biometricLoading;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm mx-4">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5E6D3]">
              <Lock className="h-7 w-7 text-[#6B4E3D]" />
            </div>
            <h1 className="text-2xl font-bold text-[#6B4E3D]">
              Aluh
            </h1>
            <p className="text-[var(--admin-muted)] text-sm mt-1">Panel de administración</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-sm mb-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {passkeyOptions && (
            <>
              <button
                type="button"
                onClick={handleBiometric}
                disabled={busy}
                className="w-full rounded-xl py-3 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: "#6B4E3D", color: "#ffffff" }}
              >
                <Fingerprint className="h-5 w-5" />
                {biometricLoading ? "Verificando..." : "Entrar con huella o cara"}
              </button>

              <div className="flex items-center gap-3 my-5">
                <span className="h-px flex-1" style={{ backgroundColor: "var(--admin-border)" }} />
                <span className="text-xs" style={{ color: "var(--admin-muted)" }}>
                  o con tu contraseña
                </span>
                <span className="h-px flex-1" style={{ backgroundColor: "var(--admin-border)" }} />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Escribe tu contraseña"
              className="w-full rounded-xl border border-[var(--admin-input-border)] bg-[var(--admin-input)] px-4 py-3 text-[var(--admin-text)] placeholder:text-[var(--admin-placeholder)] focus:border-[#6B4E3D] focus:ring-1 focus:ring-[#6B4E3D] outline-none transition-colors"
              autoFocus={!passkeyOptions}
            />

            <button
              type="submit"
              disabled={busy || !password}
              className={
                passkeyOptions
                  ? "w-full rounded-xl border py-3 font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  : "w-full rounded-xl bg-[#6B4E3D] text-white py-3 font-medium hover:bg-[#553D2F] transition-colors disabled:opacity-50 cursor-pointer"
              }
              style={
                passkeyOptions
                  ? { borderColor: "var(--admin-border)", color: "var(--admin-text)" }
                  : undefined
              }
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
      </div>
    </div>
  );
}
