"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, RefreshCw, X } from "lucide-react";
import { ApiError, api } from "@/lib/api";
import type { InventarioDeRespuestas, Riesgo } from "@/lib/api";
import { useLabStore } from "@/lib/labStore";

/**
 * Las preguntas de concientización del final del recorrido.
 *
 * Cada respuesta se vincula al riesgo del catálogo sobre el que se evaluó
 * (`POST /respuestas` exige `riesgo_id`), así que las preguntas no son texto
 * suelto: salen de `GET /riesgos`, que es la configuración del laboratorio. Si
 * un admin agrega un riesgo al catálogo, aparece aquí sin tocar el frontend.
 *
 * La pregunta es siempre la misma —¿esto te parece un riesgo real?— porque lo
 * que se mide no es cultura general sino si el recorrido cambió la percepción:
 * `es_correcta` es "reconoció como grave lo que el catálogo marca como grave".
 */

const CODIGO_DE_PREGUNTA = "reconoce-riesgo";

export default function CuestionarioDeRiesgos({ juegoId }: { juegoId?: string | null }) {
  const sesionId = useLabStore((s) => s.sesionId);

  const [riesgos, setRiesgos] = useState<Riesgo[]>([]);
  const [inventario, setInventario] = useState<InventarioDeRespuestas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!sesionId) {
      setCargando(false);
      return;
    }
    setCargando(true);
    try {
      const [catalogo, respuestas] = await Promise.all([
        api.riesgos.listar({ limite: 50, solo_activos: true }),
        api.respuestas.listar(sesionId),
      ]);
      setRiesgos(catalogo.riesgos);
      setInventario(respuestas);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el cuestionario");
    } finally {
      setCargando(false);
    }
  }, [sesionId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const responder = async (riesgo: Riesgo, loConsideraGrave: boolean) => {
    if (!sesionId || !juegoId) return;
    setEnviando(riesgo.id);
    setError(null);

    try {
      await api.respuestas.registrar({
        sesion_id: sesionId,
        juego_id: juegoId,
        riesgo_id: riesgo.id,
        pregunta_codigo: CODIGO_DE_PREGUNTA,
        respuesta: loConsideraGrave ? "si" : "no",
        // `es_grave` lo deriva el backend del nivel: el cliente no reimplementa
        // la regla, solo compara contra ella.
        es_correcta: loConsideraGrave === riesgo.es_grave,
      });
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar tu respuesta");
    } finally {
      setEnviando(null);
    }
  };

  const respondidos = new Map((inventario?.respuestas ?? []).map((r) => [r.riesgo_id, r]));

  if (!sesionId) return null;

  return (
    <section className="border-t border-gold/15 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-xs uppercase tracking-widest text-trust">Antes de irte</p>
        <h2 className="mt-2 font-marquee text-4xl text-paper sm:text-5xl">
          ¿Cuál de estas cosas te parece grave?
        </h2>
        <p className="mt-4 max-w-2xl text-sm text-paper/70">
          Cada una ocurrió, de alguna forma, durante tu recorrido. Responde con lo que piensas ahora: no hay
          penalización, y el laboratorio guarda tu respuesta junto al riesgo del catálogo sobre el que te evaluó.
        </p>

        {inventario && inventario.resumen.total > 0 && (
          <p className="mt-4 font-mono text-xs text-gold">
            {inventario.resumen.correctas} de {inventario.resumen.total} coinciden con el catálogo (
            {inventario.resumen.aciertos_porcentaje}% de aciertos).
          </p>
        )}

        {error && <p className="mt-4 font-mono text-xs text-alert">{error}</p>}

        {cargando ? (
          <div className="mt-8 flex items-center gap-3 text-paper/50">
            <RefreshCw size={18} className="animate-spin" />
            <span className="font-mono text-xs uppercase tracking-widest">Cargando catálogo de riesgos…</span>
          </div>
        ) : riesgos.length === 0 ? (
          <p className="mt-8 font-mono text-xs text-paper/40">
            El catálogo de riesgos está vacío. Siémbralo en el backend con <code>npm run db:seed</code>.
          </p>
        ) : (
          <ul className="mt-8 space-y-4">
            {riesgos.map((riesgo) => {
              const respuesta = respondidos.get(riesgo.id);

              return (
                <li key={riesgo.id} className="rounded-lg border border-paper/10 bg-felt/60 felt-texture p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-lg italic text-paper">{riesgo.titulo}</h3>
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase ${
                            riesgo.es_grave ? "bg-alert/15 text-alert" : "bg-paper/10 text-paper/60"
                          }`}
                        >
                          {riesgo.nivel}
                        </span>
                        <span className="font-mono text-[10px] text-paper/30">{riesgo.codigo}</span>
                      </div>
                      <p className="text-sm text-paper/70">{riesgo.descripcion}</p>

                      {/* La recomendación solo aparece al responder: enseñarla
                          antes convertiría la pregunta en un examen con las
                          respuestas impresas al lado. */}
                      {respuesta && (
                        <p className="mt-3 border-l-2 border-trust/40 pl-3 text-sm text-trust">
                          {riesgo.recomendacion}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {respuesta ? (
                        <span
                          className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-xs ${
                            respuesta.es_correcta
                              ? "border-trust/40 bg-trust/10 text-trust"
                              : "border-alert/40 bg-alert/10 text-alert"
                          }`}
                        >
                          {respuesta.es_correcta ? <Check size={14} /> : <AlertTriangle size={14} />}
                          Dijiste &ldquo;{respuesta.respuesta}&rdquo;
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => void responder(riesgo, true)}
                            disabled={enviando === riesgo.id || !juegoId}
                            className="rounded-md bg-gold px-4 py-2 font-mono text-xs font-semibold text-void hover:brightness-110 disabled:opacity-40"
                          >
                            Sí, es grave
                          </button>
                          <button
                            onClick={() => void responder(riesgo, false)}
                            disabled={enviando === riesgo.id || !juegoId}
                            className="flex items-center gap-1.5 rounded-md border border-paper/20 px-4 py-2 font-mono text-xs text-paper/70 hover:border-alert hover:text-alert disabled:opacity-40"
                          >
                            <X size={12} /> No me preocupa
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!juegoId && !cargando && riesgos.length > 0 && (
          <p className="mt-4 font-mono text-xs text-paper/40">
            El catálogo de juegos todavía no cargó: cada respuesta se vincula a la sala donde se evaluó.
          </p>
        )}
      </div>
    </section>
  );
}
