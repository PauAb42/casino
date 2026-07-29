"use client";

import { useState } from "react";
import { PermissionKey, useZeroTrustStore } from "@/lib/store";

interface PermissionModalProps {
  permission: PermissionKey;
  gameName: string;
  explanation: string;
  onClose: () => void;
}

/**
 * Ejecuta la solicitud REAL del navegador para el permiso indicado.
 * Cada rama usa la API oficial correspondiente y nunca oculta que se activó.
 */
async function requestRealPermission(
  key: PermissionKey
): Promise<{ ok: boolean; detail: string }> {
  switch (key) {
    case "location": {
      return new Promise((resolve) => {
        if (!("geolocation" in navigator)) {
          resolve({ ok: false, detail: "Geolocalización no disponible en este navegador." });
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              ok: true,
              detail: `lat: ${pos.coords.latitude.toFixed(3)}, lng: ${pos.coords.longitude.toFixed(
                3
              )}, precisión: ${Math.round(pos.coords.accuracy)}m`,
            }),
          (err) => resolve({ ok: false, detail: `Permiso denegado: ${err.message}` })
        );
      });
    }

    case "camera": {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const track = stream.getVideoTracks()[0];
        const label = track?.label || "cámara sin nombre expuesto";
        stream.getTracks().forEach((t) => t.stop()); // se apaga de inmediato: solo demostración
        return { ok: true, detail: `Acceso concedido a: ${label}. Transmisión detenida al instante.` };
      } catch (err) {
        return { ok: false, detail: "Permiso de cámara denegado o no disponible." };
      }
    }

    case "microphone": {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const track = stream.getAudioTracks()[0];
        const label = track?.label || "micrófono sin nombre expuesto";
        stream.getTracks().forEach((t) => t.stop());
        return { ok: true, detail: `Acceso concedido a: ${label}. Captura detenida al instante.` };
      } catch (err) {
        return { ok: false, detail: "Permiso de micrófono denegado o no disponible." };
      }
    }

    case "notifications": {
      if (!("Notification" in window)) {
        return { ok: false, detail: "Notificaciones no soportadas en este navegador." };
      }
      const result = await Notification.requestPermission();
      return {
        ok: result === "granted",
        detail: `Estado devuelto por el navegador: "${result}".`,
      };
    }

    case "cookies": {
      document.cookie = "czt_demo_consent=true; max-age=300; path=/";
      const readable = document.cookie.includes("czt_demo_consent");
      return {
        ok: readable,
        detail: readable
          ? "Cookie de sesión creada y leída correctamente (expira en 5 min)."
          : "El navegador bloqueó la escritura de cookies.",
      };
    }

    case "localStorage": {
      try {
        localStorage.setItem("czt_demo_visit", new Date().toISOString());
        const value = localStorage.getItem("czt_demo_visit");
        return { ok: true, detail: `Dato técnico guardado en tu navegador: ${value}` };
      } catch {
        return { ok: false, detail: "Local Storage no disponible en este contexto." };
      }
    }
  }
}

export default function PermissionModal({
  permission,
  gameName,
  explanation,
  onClose,
}: PermissionModalProps) {
  const setPermission = useZeroTrustStore((s) => s.setPermission);
  const [stage, setStage] = useState<"ask" | "loading" | "result">("ask");
  const [result, setResult] = useState<{ ok: boolean; detail: string } | null>(null);

  const handleAccept = async () => {
    setStage("loading");
    const res = await requestRealPermission(permission);
    setResult(res);
    setPermission(permission, res.ok ? "granted" : "denied", res.detail);
    setStage("result");
  };

  const handleDecline = () => {
    setPermission(permission, "denied", "El usuario rechazó la solicitud antes de que el navegador la mostrara.");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-lg border border-gold/30 bg-felt felt-texture p-6 shadow-2xl">
        <p className="font-mono text-[10px] uppercase tracking-widest text-trust">
          {gameName}
        </p>
        <h2 className="mt-1 font-marquee text-3xl text-paper">Solicitud de permiso</h2>
        <p className="mt-3 text-sm text-paper/70">{explanation}</p>

        {stage === "ask" && (
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleAccept}
              className="rounded-md bg-gold px-4 py-2.5 font-mono text-sm font-semibold text-void hover:brightness-110"
            >
              Conceder permiso (dispara el diálogo real del navegador)
            </button>
            <button
              onClick={handleDecline}
              className="rounded-md border border-paper/20 px-4 py-2.5 font-mono text-sm text-paper/70 hover:border-alert hover:text-alert"
            >
              No, gracias
            </button>
          </div>
        )}

        {stage === "loading" && (
          <p className="mt-6 font-mono text-sm text-trust animate-pulse">
            Esperando la respuesta del navegador…
          </p>
        )}

        {stage === "result" && result && (
          <div className="mt-6 space-y-4">
            <div
              className={`rounded-md border px-4 py-3 font-mono text-xs ${
                result.ok
                  ? "border-trust/40 bg-trust/10 text-trust"
                  : "border-alert/40 bg-alert/10 text-alert"
              }`}
            >
              {result.detail}
            </div>
            <p className="text-xs text-paper/60">
              Este dato ya quedó registrado en tu expediente de concientización, más abajo en la página.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-md border border-paper/20 px-4 py-2.5 font-mono text-sm text-paper/80 hover:border-gold hover:text-gold"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
