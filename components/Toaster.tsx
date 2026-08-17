"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import {
  useNotificationStore,
  type AvisoFlotante,
  type TipoDeNotificacion,
} from "@/lib/notificationStore";

/**
 * Los avisos del casino, con la piel del casino.
 *
 * Reemplaza a `alert()` y a `new Notification()` en las salas y en promociones.
 * Los dos eran del navegador: el primero **bloquea la página** (con una apuesta
 * a medias eso congela la mesa hasta que alguien pulse "Aceptar") y el segundo
 * solo aparece si el permiso de notificaciones está concedido, así que el aviso
 * más importante —"saldo insuficiente"— era invisible para quien lo negó.
 *
 * Este vive dentro del documento: siempre se ve, no bloquea nada y se puede leer
 * después en la campana, porque el store escribe en las dos superficies.
 */

const ESTILO_POR_TIPO: Record<
  TipoDeNotificacion,
  { icono: React.ElementType; color: string; borde: string; fondoIcono: string; barra: string; titulo: string }
> = {
  exito: {
    icono: CheckCircle2,
    color: "text-emerald-400",
    borde: "border-emerald-500/30",
    fondoIcono: "bg-emerald-500/10 border-emerald-500/20",
    barra: "bg-gradient-to-r from-emerald-500 to-emerald-300",
    titulo: "Listo",
  },
  error: {
    icono: XCircle,
    color: "text-red-400",
    borde: "border-red-500/30",
    fondoIcono: "bg-red-500/10 border-red-500/20",
    barra: "bg-gradient-to-r from-red-500 to-red-300",
    titulo: "No se pudo",
  },
  aviso: {
    icono: AlertTriangle,
    color: "text-[#D4AF37]",
    borde: "border-[#D4AF37]/30",
    fondoIcono: "bg-[#D4AF37]/10 border-[#D4AF37]/20",
    barra: "bg-gradient-to-r from-[#D4AF37] to-[#F3D55B]",
    titulo: "Atención",
  },
  info: {
    icono: Info,
    color: "text-[#8A2BE2]",
    borde: "border-[#8A2BE2]/30",
    fondoIcono: "bg-[#8A2BE2]/10 border-[#8A2BE2]/20",
    barra: "bg-gradient-to-r from-[#8A2BE2] to-[#c492ff]",
    titulo: "Royal Casino",
  },
};

/** Lo que tarda la animación de salida antes de quitar la fila del store. */
const MS_DE_SALIDA = 200;

function Aviso({ aviso, onCerrar }: { aviso: AvisoFlotante; onCerrar: (id: string) => void }) {
  const estilo = ESTILO_POR_TIPO[aviso.tipo];
  const Icono = estilo.icono;

  const [saliendo, setSaliendo] = useState(false);
  const [pausado, setPausado] = useState(false);

  const temporizador = useRef<number | null>(null);
  const restante = useRef(aviso.duracionMs);
  const arranque = useRef(0);

  const cerrar = useCallback(() => {
    setSaliendo(true);
    window.setTimeout(() => onCerrar(aviso.id), MS_DE_SALIDA);
  }, [aviso.id, onCerrar]);

  // El reloj se detiene mientras el puntero (o el foco del teclado) está encima:
  // un aviso que se desvanece justo cuando lo estás leyendo no informa de nada.
  useEffect(() => {
    if (aviso.duracionMs <= 0 || pausado || saliendo) return;

    arranque.current = Date.now();
    temporizador.current = window.setTimeout(cerrar, restante.current);

    return () => {
      if (temporizador.current !== null) window.clearTimeout(temporizador.current);
      restante.current = Math.max(0, restante.current - (Date.now() - arranque.current));
    };
  }, [aviso.duracionMs, pausado, saliendo, cerrar]);

  return (
    <div
      role={aviso.tipo === "error" ? "alert" : "status"}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border ${estilo.borde} bg-[#0B0E14]/95 backdrop-blur-xl shadow-2xl shadow-black/60 ${
        saliendo ? "toast-saliendo" : "toast-entrando"
      }`}
    >
      <div className="flex items-start gap-3 p-4 pr-10">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${estilo.fondoIcono} ${estilo.color} shadow-inner`}
        >
          <Icono size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className={`mb-1 text-[10px] font-bold uppercase tracking-widest ${estilo.color}`}>
            {aviso.titulo ?? estilo.titulo}
          </p>
          <p className="text-xs leading-relaxed text-gray-300 break-words">{aviso.mensaje}</p>
        </div>
      </div>

      <button
        onClick={cerrar}
        aria-label="Cerrar aviso"
        className="absolute right-3 top-3 rounded-md p-1 text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
      >
        <X size={14} />
      </button>

      {aviso.duracionMs > 0 && (
        <div className="h-0.5 w-full bg-white/5">
          <div
            className={`h-full ${estilo.barra} toast-barra`}
            style={{
              animationDuration: `${aviso.duracionMs}ms`,
              animationPlayState: pausado || saliendo ? "paused" : "running",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function Toaster() {
  const toasts = useNotificationStore((s) => s.toasts);
  const descartarToast = useNotificationStore((s) => s.descartarToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-4 top-24 z-[200] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-6 sm:w-[380px]"
    >
      {toasts.map((aviso) => (
        <Aviso key={aviso.id} aviso={aviso} onCerrar={descartarToast} />
      ))}
    </div>
  );
}
