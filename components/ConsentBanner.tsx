"use client";

import { useEffect, useRef, useState } from "react";
import { Cookie, ShieldCheck, X } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { CATEGORIAS_DEL_AVISO, useLabStore } from "@/lib/labStore";
import type { AlcanceDelAviso } from "@/lib/labStore";

/**
 * El aviso de privacidad, que aqui es el instrumento de medida del laboratorio.
 *
 * `POST /consentimientos` guarda **cuanto tardaste en decidir**, y el backend
 * marca `decidio_sin_leer` cuando fueron menos de dos segundos. Por eso el reloj
 * arranca cuando el aviso aparece en pantalla y no cuando se monta el componente:
 * medir desde antes inflaria el tiempo y borraria el dato mas revelador de todo
 * el recorrido.
 *
 * Un "acepto" con alcance vacio no autoriza nada (el backend responde 422), asi
 * que las casillas son parte del consentimiento y no un adorno.
 */

const ETIQUETAS: Record<string, { titulo: string; detalle: string }> = {
  navegador: { titulo: "Navegador", detalle: "Version, motor, idiomas y zona horaria" },
  dispositivo: { titulo: "Dispositivo", detalle: "Pantalla, nucleos, memoria y tipo de equipo" },
  red: { titulo: "Red", detalle: "Familia de tu IP (siempre hasheada) y si vienes por proxy" },
  comportamiento: { titulo: "Comportamiento", detalle: "Clics, tiempos y recorrido por las mesas" },
  ubicacion: { titulo: "Ubicacion", detalle: "Region aproximada; las coordenadas exactas nunca se guardan" },
};

const TODO_ACEPTADO: AlcanceDelAviso = {
  navegador: true,
  dispositivo: true,
  red: true,
  comportamiento: true,
  ubicacion: true,
};

const SOLO_NECESARIO: AlcanceDelAviso = { navegador: true };

export default function ConsentBanner() {
  const estado = useAuthStore((s) => s.estado);
  const sesionId = useLabStore((s) => s.sesionId);
  const consentimiento = useLabStore((s) => s.consentimiento);
  const consultado = useLabStore((s) => s.consentimientoConsultado);
  const responderAviso = useLabStore((s) => s.responderAviso);

  const [alcance, setAlcance] = useState<AlcanceDelAviso>(TODO_ACEPTADO);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [veredicto, setVeredicto] = useState<{ ms: number | null; sinLeer: boolean } | null>(null);
  const inicio = useRef<number | null>(null);

  const debeMostrarse = estado === "autenticado" && Boolean(sesionId) && consultado && !consentimiento;

  // El cronometro arranca al aparecer el aviso, no antes.
  useEffect(() => {
    if (debeMostrarse && inicio.current === null) inicio.current = performance.now();
    if (!debeMostrarse) inicio.current = null;
  }, [debeMostrarse]);

  const responder = async (aceptado: boolean, alcanceElegido: AlcanceDelAviso) => {
    setEnviando(true);
    setError(null);
    const ms = inicio.current === null ? null : Math.round(performance.now() - inicio.current);

    try {
      const registrado = await responderAviso(aceptado, alcanceElegido, ms);
      if (registrado?.decidio_sin_leer) {
        setVeredicto({ ms: registrado.ms_decision, sinLeer: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar tu decision");
    } finally {
      setEnviando(false);
    }
  };

  // El aviso "decidiste sin leer" sobrevive al banner: es la leccion, no un toast.
  if (!debeMostrarse) {
    if (!veredicto) return null;
    return (
      <div className="fixed bottom-6 right-6 z-[60] max-w-sm rounded-2xl border border-[#D4AF37]/40 bg-[#0B0E14] p-5 shadow-2xl animate-in slide-in-from-bottom-4">
        <div className="mb-2 flex items-start justify-between gap-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Quedo registrado</p>
          <button onClick={() => setVeredicto(null)} className="text-gray-500 hover:text-white">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-gray-300">
          Decidiste en <span className="font-bold text-white">{veredicto.ms} ms</span>. El laboratorio marca como
          &ldquo;decidido sin leer&rdquo; todo lo que baja de 2 000 ms — y asi es como se acepta la mayoria de los
          avisos de privacidad.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300 sm:items-center sm:p-6">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0B0E14] shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 duration-300 sm:zoom-in-95">
        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#8A2BE2]/30 bg-[#1E1133]">
              <Cookie size={20} className="text-[#8A2BE2]" />
            </div>
            <h3 className="text-lg font-bold text-white">Aviso de privacidad</h3>
          </div>

          <p className="mb-5 text-sm leading-relaxed text-gray-400">
            Royal Casino registra lo que ocurre durante tu recorrido para mostrartelo al final. Elige que
            autorizas: tu decision y <span className="text-gray-300">cuanto tardaste en tomarla</span> quedan
            guardadas junto con el resto.
          </p>

          {detalleAbierto && (
            <div className="mb-5 space-y-2 rounded-xl border border-white/5 bg-[#0F131D] p-4">
              {CATEGORIAS_DEL_AVISO.map((categoria) => (
                <label key={categoria} className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(alcance[categoria])}
                    onChange={(e) => setAlcance((previo) => ({ ...previo, [categoria]: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent text-[#8A2BE2] focus:ring-[#8A2BE2]"
                  />
                  <span>
                    <span className="block text-sm text-white">{ETIQUETAS[categoria].titulo}</span>
                    <span className="block text-xs text-gray-500">{ETIQUETAS[categoria].detalle}</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          {error && <p className="mb-4 text-xs text-red-400">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={() => setDetalleAbierto((v) => !v)}
              disabled={enviando}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              {detalleAbierto ? "Ocultar detalle" : "Ver que se guarda"}
            </button>
            <button
              onClick={() => void responder(false, {})}
              disabled={enviando}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              Rechazar
            </button>
            <button
              onClick={() => void responder(true, detalleAbierto ? alcance : SOLO_NECESARIO)}
              disabled={enviando}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              Solo lo necesario
            </button>
            <button
              onClick={() => void responder(true, TODO_ACEPTADO)}
              disabled={enviando}
              className="rounded-xl bg-[#3B2063] px-8 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-[#4A297C] disabled:opacity-50"
            >
              {enviando ? "Registrando…" : "Aceptar todo"}
            </button>
          </div>

          <p className="mt-4 flex items-center gap-2 text-[11px] text-gray-600">
            <ShieldCheck size={12} /> Rechazar no te penaliza: puedes seguir jugando igual.
          </p>
        </div>
      </div>
    </div>
  );
}
