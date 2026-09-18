"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, X, Sparkles } from "lucide-react";

type WelcomeScreenProps = {
  open: boolean;
  greeting: string;
  today: string;
  onClose: () => void;
  onCapture: () => void;
};

/**
 * Pantalla completa de bienvenida.
 *
 * Va como overlay y no como ruta propia: una ruta obligaría a redirigir y
 * rompería el botón "atrás" del celular. El saludo y la fecha llegan por props
 * ya calculados en el cliente, porque la hora del servidor es UTC y la de ella
 * no.
 */
export function WelcomeScreen({
  open,
  greeting,
  today,
  onClose,
  onCapture,
}: WelcomeScreenProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Sin scroll detrás del overlay mientras está abierto.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      style={{
        position: "fixed",
        inset: 0,
        // Por encima del sidebar (40) y del botón de menú (50).
        zIndex: 60,
        backgroundColor: "var(--admin-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        overflowY: "auto",
      }}
    >
      {/* No se cierra tocando el fondo: a pantalla completa eso se toca sin
          querer y ella perdería el mensaje antes de leerlo. */}
      <button
        onClick={onClose}
        aria-label="Cerrar"
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 48,
          height: 48,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "1px solid var(--admin-border)",
          color: "var(--admin-muted)",
          cursor: "pointer",
        }}
      >
        <X size={22} />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        style={{ width: "100%", maxWidth: 460, textAlign: "center" }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            margin: "0 auto 24px",
            background: "linear-gradient(135deg, #6B4E3D, #553D2F)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sparkles size={32} color="#F5E6D3" />
        </div>

        <h1
          style={{
            fontSize: 30,
            fontWeight: 800,
            lineHeight: 1.2,
            color: "var(--admin-text)",
            marginBottom: 6,
          }}
        >
          {greeting}, Aluh
        </h1>
        <p style={{ fontSize: 14, color: "var(--admin-muted)", marginBottom: 28 }}>
          {today}
        </p>

        <div
          style={{
            borderRadius: 20,
            padding: 24,
            backgroundColor: "var(--admin-card)",
            border: "1px solid var(--admin-border)",
            marginBottom: 24,
            textAlign: "left",
          }}
        >
          <p
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "var(--admin-text)",
              marginBottom: 10,
              lineHeight: 1.4,
            }}
          >
            ¿Anotaste algo en un papel? No tienes que volver a escribirlo aquí.
          </p>
          <p style={{ fontSize: 15, color: "var(--admin-muted)", lineHeight: 1.6 }}>
            Tómale una foto a tu nota y yo la paso a texto por ti. Si algo queda
            mal escrito, lo corriges antes de guardar.
          </p>
        </div>

        <button
          onClick={onCapture}
          style={{
            width: "100%",
            minHeight: 60,
            borderRadius: 18,
            border: "none",
            background: "linear-gradient(135deg, #6B4E3D, #553D2F)",
            color: "#fff",
            fontSize: 17,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          <Camera size={22} />
          Tomar una foto de mi nota
        </button>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            minHeight: 52,
            borderRadius: 16,
            backgroundColor: "transparent",
            border: "1px solid var(--admin-border)",
            color: "var(--admin-text)",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Empezar el día
        </button>
      </motion.div>
    </motion.div>
  );
}
