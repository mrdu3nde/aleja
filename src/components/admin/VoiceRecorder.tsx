"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, AlertCircle } from "lucide-react";
import { toDataUrl, toMonoWav } from "@/lib/audio";

/** Cuatro minutos. Pasado eso el archivo pesa más de lo que aguanta la función. */
const MAX_SECONDS = 240;

type Props = {
  /** Recibe el audio ya convertido a WAV, listo para mandar al servidor. */
  onRecorded: (audioDataUrl: string) => void;
  disabled?: boolean;
  label?: string;
};

function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VoiceRecorder({ onRecorded, disabled, label = "Grabar nota" }: Props) {
  const [recording, setRecording] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  // Soltar el micrófono si ella se va de la pantalla a media grabación: sin
  // esto, el punto rojo del navegador se queda encendido.
  useEffect(() => {
    return () => {
      stopTimer();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      recorder?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const start = async () => {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Este navegador no puede grabar audio. Escribe la nota.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      setError("No diste permiso al micrófono, o está ocupado por otra app.");
      return;
    }

    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = async () => {
      stopTimer();
      stream.getTracks().forEach((track) => track.stop());
      setRecording(false);
      setPreparing(true);

      try {
        const raw = new Blob(chunksRef.current, { type: recorder.mimeType });
        // Se normaliza a WAV aquí y no en el servidor: cada navegador graba en
        // un formato distinto, y así el servidor recibe siempre lo mismo.
        const wav = await toMonoWav(raw);
        onRecorded(await toDataUrl(wav));
      } catch {
        setError("No se pudo preparar el audio. Inténtalo otra vez.");
      } finally {
        setPreparing(false);
        setSeconds(0);
      }
    };

    recorder.start();
    setRecording(true);
    setSeconds(0);

    timerRef.current = setInterval(() => {
      setSeconds((value) => {
        if (value + 1 >= MAX_SECONDS) {
          recorderRef.current?.stop();
          return MAX_SECONDS;
        }
        return value + 1;
      });
    }, 1000);
  };

  const stop = () => recorderRef.current?.stop();

  if (preparing) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--admin-muted)" }}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Preparando el audio...
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-sm mb-3">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {recording ? (
        <div className="flex items-center gap-3">
          <button
            onClick={stop}
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium cursor-pointer"
            style={{ backgroundColor: "#DC2626", color: "#ffffff" }}
          >
            <Square className="h-4 w-4" />
            Detener
          </button>
          <span
            className="flex items-center gap-2 text-sm tabular-nums"
            style={{ color: "var(--admin-text)" }}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#DC2626" }}
            />
            {clock(seconds)}
            {seconds >= MAX_SECONDS - 30 && (
              <span style={{ color: "var(--admin-muted)" }}>
                (máx {clock(MAX_SECONDS)})
              </span>
            )}
          </span>
        </div>
      ) : (
        <button
          onClick={start}
          disabled={disabled}
          className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: "#6B4E3D", color: "#ffffff" }}
        >
          <Mic className="h-4 w-4" />
          {label}
        </button>
      )}
    </div>
  );
}
