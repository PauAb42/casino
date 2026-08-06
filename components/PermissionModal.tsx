"use client";

import { useRef, useState } from "react";
import type { PermissionKey } from "@/lib/store";
import { pedirPermiso, rechazarSinAbrirDialogo } from "@/lib/permisosLab";
import type { ResultadoDePermiso } from "@/lib/permisosLab";

interface PermissionModalProps {
  permission: PermissionKey;
  gameName: string;
  explanation: string;
  juegoId?: string | null;
  onClose: () => void;
  onResolved?: (resultado: ResultadoDePermiso) => void;
}

/**
 * El diálogo del laboratorio.
 *
 * Ya no ejecuta el permiso por su cuenta: delega en `pedirPermiso`, que hace los
 * dos pasos que el backend necesita —registrar que el sitio *pidió* el permiso y,
 * después, cómo se respondió con el tiempo que se tardó— y solo entonces abre el
 * diálogo real del navegador. Medir esa decisión es el dato central del ejercicio.
 */
export default function PermissionModal({
  permission,
  gameName,
  explanation,
  juegoId,
  onClose,
  onResolved,
}: PermissionModalProps) {
  const [stage, setStage] = useState<"ask" | "loading" | "result">("ask");
  const [result, setResult] = useState<ResultadoDePermiso | null>(null);
  // Desde que se ve la solicitud hasta que se contesta: es el `ms_decision` de
  // quien corta antes de que el navegador aparezca.
  const abierto = useRef(performance.now());

  const handleAccept = async () => {
    setStage("loading");
    const res = await pedirPermiso(permission, { juegoId });
    setResult(res);
    onResolved?.(res);
    setStage("result");
  };

  const handleDecline = () => {
    // Rechazar antes del diálogo también se registra: el sitio pidió el permiso
    // igual, y esa respuesta es tan válida como la del navegador.
    void rechazarSinAbrirDialogo(permission, {
      juegoId,
      msDecision: Math.round(performance.now() - abierto.current),
    });
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
              onClick={() => void handleAccept()}
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
              {result.detalle}
            </div>
            {result.permiso?.concedido_sin_pensar && (
              <p className="rounded-md border border-gold/40 bg-gold/10 px-4 py-3 font-mono text-xs text-gold">
                Lo concediste en {result.permiso.ms_decision} ms. El laboratorio marca como
                &ldquo;concedido sin pensar&rdquo; todo lo que baja de 2 000 ms.
              </p>
            )}
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
