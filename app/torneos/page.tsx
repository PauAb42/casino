"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy, Crown, Clock, Users, ChevronLeft,
  RefreshCw, CircleDashed, Medal, Info,
} from "lucide-react";
import { ApiError, api } from "@/lib/api";
import type { DetalleDeTorneo, Torneo } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import { useSesionRequerida } from "@/lib/useSesionRequerida";
import { useNotificationStore } from "@/lib/notificationStore";

/**
 * Torneos.
 *
 * La portada enlazaba a `/torneos` y esta ruta no existía: el enlace devolvía un
 * 404 y la bolsa de "$500,000" de la pantalla de promociones era texto sin nada
 * detrás —ni tabla, ni modelo, ni endpoint—.
 *
 * Lo que hace que la clasificación signifique algo es que **no se puede
 * escribir**: los puntos los acumulan las rondas al resolverse en el servidor, y
 * no existe ningún endpoint para sumarlos por otra vía. Inscribirse solo abre la
 * puerta; a partir de ahí, la única forma de subir es apostar.
 */

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

const ETIQUETA_DE_ESTADO: Record<string, { texto: string; clase: string }> = {
  activo: { texto: "EN CURSO", clase: "bg-green-600 text-white" },
  proximo: { texto: "PRÓXIMO", clase: "bg-blue-600 text-white" },
  finalizado: { texto: "FINALIZADO", clase: "bg-gray-700 text-gray-300" },
};

function tiempoRestante(hasta: string): string {
  const ms = new Date(hasta).getTime() - Date.now();
  if (ms <= 0) return "Terminado";

  const dias = Math.floor(ms / 86_400_000);
  if (dias > 0) return `Termina en ${dias} día${dias > 1 ? "s" : ""}`;

  const horas = Math.floor(ms / 3_600_000);
  if (horas > 0) return `Termina en ${horas} h`;

  return `Termina en ${Math.max(1, Math.floor(ms / 60_000))} min`;
}

export default function TorneosPage() {
  const router = useRouter();
  const { user, resolviendo } = useSesionRequerida();
  const rol = useAuthStore((s) => s.cuenta?.rol);
  const { addNotification } = useNotificationStore();

  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [detalle, setDetalle] = useState<DetalleDeTorneo | null>(null);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [inscribiendo, setInscribiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarTorneos = useCallback(async () => {
    setCargando(true);
    try {
      const { torneos: filas } = await api.torneos.listar();
      setTorneos(filas);
      setError(null);
      // Se abre el primero por defecto: una lista sin clasificación no dice nada.
      if (filas.length > 0) setSeleccionado((actual) => actual ?? filas[0].id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los torneos");
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarDetalle = useCallback(async (id: string) => {
    try {
      setDetalle(await api.torneos.obtener(id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar la clasificación");
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void cargarTorneos();
  }, [user, cargarTorneos]);

  useEffect(() => {
    if (!seleccionado) return;
    void cargarDetalle(seleccionado);
  }, [seleccionado, cargarDetalle]);

  const inscribirse = async (id: string) => {
    setInscribiendo(true);
    setError(null);

    try {
      await api.torneos.inscribirse(id);
      addNotification("Estás inscrito. A partir de ahora, cada apuesta suma puntos.");
      await Promise.all([cargarTorneos(), cargarDetalle(id)]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo completar la inscripción");
    } finally {
      setInscribiendo(false);
    }
  };

  if (resolviendo || !user) return <div className="min-h-screen bg-[#05050A]" />;

  const torneoActivo = torneos.find((t) => t.id === seleccionado) ?? null;

  return (
    <div className="min-h-screen bg-[#080B12] text-white font-sans pb-20 selection:bg-[#8A2BE2]/30">
      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center w-9 h-9 rounded border border-white/10 hover:bg-white/5 transition-colors"
            aria-label="Volver"
          >
            <ChevronLeft size={20} className="text-[#D4AF37]" />
          </button>
          <div>
            <h1 className="text-4xl font-black tracking-widest text-[#D4AF37] uppercase">Torneos</h1>
            <p className="text-gray-400 text-sm mt-1">
              Los puntos salen de tus apuestas resueltas. No hay otra forma de subir en la tabla.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Las cuentas de investigación y administración no juegan ni compiten:
            su actividad contaminaría los datos del estudio. */}
        {rol && rol !== "participante" && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
            Tu cuenta es de <strong>{rol}</strong>: puedes consultar la clasificación, pero no inscribirte
            ni apostar. Las partidas del personal del estudio se mezclarían con las de los participantes.
          </div>
        )}

        {cargando ? (
          <div className="flex items-center justify-center py-24 text-gray-500 gap-3">
            <RefreshCw size={22} className="animate-spin text-[#8A2BE2]" />
            <span className="text-sm">Cargando torneos…</span>
          </div>
        ) : torneos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <CircleDashed size={40} className="mb-4 opacity-30" />
            <p className="text-sm">No hay torneos abiertos en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-8 items-start">
            {/* LISTA DE TORNEOS */}
            <aside className="flex flex-col gap-4">
              {torneos.map((torneo) => {
                const activo = torneo.id === seleccionado;
                const etiqueta = ETIQUETA_DE_ESTADO[torneo.estado] ?? ETIQUETA_DE_ESTADO.finalizado;

                return (
                  <button
                    key={torneo.id}
                    onClick={() => setSeleccionado(torneo.id)}
                    className={`text-left bg-[#0B0E14] border rounded-2xl p-5 transition-all ${
                      activo
                        ? "border-[#8A2BE2] shadow-[0_0_25px_rgba(138,43,226,0.2)]"
                        : "border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <Crown size={24} className="text-[#D4AF37]" />
                      <span className={`text-[9px] font-black px-2 py-1 rounded tracking-widest ${etiqueta.clase}`}>
                        {etiqueta.texto}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold mb-1">{torneo.nombre}</h2>
                    <p className="text-xs text-gray-400 leading-relaxed mb-4">{torneo.descripcion}</p>

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500">Bolsa</span>
                      <span className="text-xl font-black text-[#D4AF37]">
                        {currency.format(torneo.bolsa_mxn)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {tiempoRestante(torneo.termina_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Medal size={12} /> {torneo.plazas_premiadas} plazas
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy size={12} /> 1 pto / {currency.format(torneo.mxn_por_punto)}
                      </span>
                    </div>

                    {torneo.inscripcion && (
                      <p className="mt-3 text-[11px] text-[#8A2BE2] font-bold">
                        Inscrito · {torneo.inscripcion.puntos} punto
                        {torneo.inscripcion.puntos === 1 ? "" : "s"}
                      </p>
                    )}
                  </button>
                );
              })}
            </aside>

            {/* CLASIFICACIÓN */}
            <section className="bg-[#0B0E14] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">{torneoActivo?.nombre ?? "Clasificación"}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {torneoActivo?.juego
                      ? `Solo cuenta lo apostado en ${torneoActivo.juego.nombre}.`
                      : "Cuenta lo apostado en cualquier sala."}
                  </p>
                </div>

                {torneoActivo && !torneoActivo.inscripcion && rol === "participante" && (
                  <button
                    onClick={() => void inscribirse(torneoActivo.id)}
                    disabled={inscribiendo || torneoActivo.estado === "finalizado"}
                    className="bg-gradient-to-r from-[#D4AF37] to-[#F3D55B] hover:from-[#F3D55B] hover:to-[#FFF1A0] text-black font-black py-2.5 px-6 rounded-xl transition-all tracking-widest uppercase text-xs disabled:opacity-50 disabled:grayscale"
                  >
                    {inscribiendo ? "Inscribiendo…" : "Inscribirme"}
                  </button>
                )}
              </div>

              {/* Mi posición, aunque quede fuera del top visible. */}
              {detalle?.mi_posicion && (
                <div className="px-6 py-4 bg-[#1E1133]/40 border-b border-[#8A2BE2]/20 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
                  <span className="text-[10px] uppercase tracking-widest text-[#A78BFA]">Tu posición</span>
                  <span className="font-black text-xl text-white">#{detalle.mi_posicion.posicion}</span>
                  <span className="text-gray-400 text-xs">{detalle.mi_posicion.puntos} puntos</span>
                  {detalle.mi_posicion.premio_estimado_centavos > 0 && (
                    <span className="text-[#D4AF37] text-xs font-bold">
                      Premio estimado: {currency.format(detalle.mi_posicion.premio_estimado_centavos / 100)}
                    </span>
                  )}
                </div>
              )}

              <div className="overflow-x-auto custom-scrollbar min-h-[360px]">
                <table className="w-full text-left border-collapse min-w-[620px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#131722]/50">
                      <th className="py-4 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">#</th>
                      <th className="py-4 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Jugador</th>
                      <th className="py-4 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Puntos</th>
                      <th className="py-4 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Apostado</th>
                      <th className="py-4 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Premio est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {detalle && detalle.clasificacion.length > 0 ? (
                      detalle.clasificacion.map((fila) => (
                        <tr key={fila.codigo_publico} className="hover:bg-white/[0.03] transition-colors">
                          <td className="py-3 px-6 font-black text-gray-300">{fila.posicion}</td>
                          <td className="py-3 px-6 text-sm text-gray-200 flex items-center gap-2">
                            {fila.posicion <= 3 && (
                              <Medal
                                size={14}
                                className={
                                  fila.posicion === 1
                                    ? "text-[#D4AF37]"
                                    : fila.posicion === 2
                                      ? "text-gray-300"
                                      : "text-amber-700"
                                }
                              />
                            )}
                            {fila.alias}
                          </td>
                          <td className="py-3 px-6 text-sm font-mono text-white">{fila.puntos}</td>
                          <td className="py-3 px-6 text-sm text-gray-400">{currency.format(fila.apostado_mxn)}</td>
                          <td className="py-3 px-6 text-sm text-[#D4AF37]">
                            {fila.premio_estimado_mxn > 0 ? currency.format(fila.premio_estimado_mxn) : "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <Users size={36} className="mb-4 opacity-30" />
                            <p className="text-sm">Todavía no hay nadie en la tabla.</p>
                            <p className="text-xs mt-1 max-w-sm">
                              Inscríbete y apuesta: los puntos se acumulan solos al resolverse cada ronda.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {detalle && detalle.reparto_de_bolsa.length > 0 && (
                <div className="px-6 py-4 border-t border-white/5 text-[11px] text-gray-500 flex items-start gap-2">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <span>
                    La bolsa se reparte entre las {detalle.torneo.plazas_premiadas} primeras posiciones.
                    El primer puesto se lleva {currency.format(detalle.reparto_de_bolsa[0].premio_centavos / 100)}.
                    El premio se calcula al vuelo desde la posición: nadie lo escribe a mano.
                  </span>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
