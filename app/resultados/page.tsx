"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar, ChevronDown, Gamepad2, Coins, Trophy,
  TrendingUp, Star, CircleDashed,
  RefreshCw
} from "lucide-react";
import { useCatalogoStore } from "@/lib/catalogoStore";
import { useSesionRequerida } from "@/lib/useSesionRequerida";
import { api } from "@/lib/api";
import type { RondaDeJuego } from "@/lib/api";

/**
 * Historial de apuestas.
 *
 * Esta pantalla leía `GET /resultados`, que devuelve **una fila por juego y
 * sesión** —el resumen del recorrido para el estudio— y la presentaba como si
 * fueran rondas: llamaba "Rondas jugadas" a un conteo de juegos distintos y
 * formateaba el puntaje como pesos, aunque cada sala mandaba una magnitud
 * distinta (puntuación, retorno o premio). Las cifras eran semánticamente
 * incorrectas y no comparables entre sí.
 *
 * Ahora lee `GET /rondas`, que sí es el historial financiero: una fila por
 * apuesta, con su importe, su premio y su neto, todo en la misma unidad.
 */

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};

export default function ResultadosPage() {
  const { user, resolviendo } = useSesionRequerida();
  const juegosPorSlug = useCatalogoStore((s) => s.porSlug);
  const cargarCatalogo = useCatalogoStore((s) => s.cargar);

  const [rondas, setRondas] = useState<RondaDeJuego[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de Filtros
  const [selectedGame, setSelectedGame] = useState("Todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    void cargarCatalogo();
  }, [cargarCatalogo]);

  /**
   * El historial es de la **cuenta**, no de la sesión de laboratorio.
   *
   * Las rondas cuelgan de la cuenta a propósito: el dinero es de la persona, no
   * de la visita. Antes esta pantalla dependía de `sesionId` y se quedaba vacía
   * mientras la sesión no estuviera abierta, aunque hubiera partidas de sobra.
   */
  useEffect(() => {
    if (!user) return;
    let vivo = true;

    (async () => {
      setCargando(true);
      try {
        const datos = await api.rondas.listar({ limite: 200 });
        if (vivo) setRondas(datos.rondas);
      } catch (err) {
        if (vivo) setError(err instanceof Error ? err.message : "No se pudieron cargar tus resultados");
      } finally {
        if (vivo) setCargando(false);
      }
    })();

    return () => {
      vivo = false;
    };
  }, [user]);

  // Nombre del juego por id: la ronda solo trae `juego_id`.
  const nombrePorId = useMemo(() => {
    const mapa: Record<string, string> = {};
    for (const juego of Object.values(juegosPorSlug)) mapa[juego.id] = juego.nombre;
    return mapa;
  }, [juegosPorSlug]);

  const filteredResults = useMemo(() => {
    return rondas.filter((fila) => {
      const fecha = new Date(fila.creado_at);
      if (startDate && fecha < new Date(startDate + "T00:00:00")) return false;
      if (endDate && fecha > new Date(endDate + "T23:59:59")) return false;
      if (selectedGame !== "Todos" && nombrePorId[fila.juego_id] !== selectedGame) return false;
      return true;
    });
  }, [rondas, selectedGame, startDate, endDate, nombrePorId]);

  /**
   * Los totales de las tarjetas.
   *
   * Se recalculan sobre las filas filtradas para que el resumen y la tabla digan
   * lo mismo. Todo está en la misma unidad —pesos apostados y pesos devueltos—,
   * así que sumar y comparar ahora significa algo.
   */
  const rondasJugadas = filteredResults.length;
  const apostado = filteredResults.reduce((acc, r) => acc + r.apuesta_mxn, 0);
  const retornado = filteredResults.reduce((acc, r) => acc + r.premio_mxn, 0);
  const neto = retornado - apostado;
  const ganadas = filteredResults.filter((r) => r.premio_centavos > r.apuesta_centavos).length;
  const mayorPremio = filteredResults.length > 0 ? Math.max(...filteredResults.map((r) => r.premio_mxn)) : 0;

  if (resolviendo || !user) return <div className="min-h-screen bg-[#05050A]" />;

  return (
    <div className="min-h-screen bg-[#080B12] text-white font-sans pb-20 selection:bg-[#8A2BE2]/30">
      
      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-12">
        
        {/* HEADER: Título y Filtros */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-widest text-[#D4AF37] mb-2 uppercase">
              Resultados
            </h1>
            <p className="text-gray-400 text-sm">
              Una fila por apuesta, tal como quedó registrada en el backend. El comprobante permite
              recalcular cada ronda y verificar que el resultado no se tocó después.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
            
            {/* Filtro Fecha Funcional */}
            <div className="flex items-center justify-between bg-[#0F131D] border border-white/10 rounded-lg px-3 py-2 w-full sm:w-auto hover:border-white/20 transition-colors gap-2 shadow-inner">
              <Calendar size={16} className="text-[#D4AF37] shrink-0" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm text-gray-300 focus:outline-none [color-scheme:dark] cursor-pointer"
              />
              <span className="text-gray-500">-</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm text-gray-300 focus:outline-none [color-scheme:dark] cursor-pointer"
              />
            </div>

            {/* Filtro Juego Funcional */}
            <div className="relative flex items-center bg-[#0F131D] border border-white/10 rounded-lg px-4 py-2.5 w-full sm:w-[220px] hover:border-white/20 transition-colors shadow-inner">
              {/* Las opciones salen del catálogo, no de una lista fija. */}
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full bg-transparent text-sm text-gray-300 focus:outline-none appearance-none cursor-pointer pr-8 [&>option]:bg-[#0F131D]"
              >
                <option value="Todos">Todos los juegos</option>
                {Object.values(juegosPorSlug).map((juego) => (
                  <option key={juego.id} value={juego.nombre}>
                    {juego.nombre}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="text-[#D4AF37] absolute right-4 pointer-events-none" />
            </div>

          </div>
        </div>

        {/* TARJETAS DE RESUMEN (Dinámicas y Ajustadas) */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          
          <div className="bg-[#120C17] border border-[#a855f7]/30 rounded-xl p-4 flex items-center gap-3 sm:gap-4 shadow-lg overflow-hidden transition-all">
            <Gamepad2 size={32} className="text-[#a855f7] opacity-80 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#a855f7] mb-0.5 truncate">Rondas Jugadas</p>
              <p className="text-lg xl:text-xl font-bold text-white truncate">{rondasJugadas}</p>
            </div>
          </div>

          <div className="bg-[#0B1511] border border-[#22c55e]/30 rounded-xl p-4 flex items-center gap-3 sm:gap-4 shadow-lg overflow-hidden transition-all">
            <Coins size={32} className="text-[#22c55e] opacity-80 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#22c55e] mb-0.5 truncate">Total Apostado</p>
              <p className="text-lg xl:text-xl font-bold text-white truncate">{formatMoney(apostado)}</p>
            </div>
          </div>

          <div className="bg-[#17130B] border border-[#eab308]/30 rounded-xl p-4 flex items-center gap-3 sm:gap-4 shadow-lg overflow-hidden transition-all">
            <Trophy size={32} className="text-[#eab308] opacity-80 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#eab308] mb-0.5 truncate">Rondas Ganadas</p>
              <p className="text-lg xl:text-xl font-bold text-white truncate">{ganadas}</p>
            </div>
          </div>

          <div className="bg-[#0B121A] border border-[#3b82f6]/30 rounded-xl p-4 flex items-center gap-3 sm:gap-4 shadow-lg overflow-hidden transition-all">
            <TrendingUp size={32} className="text-[#3b82f6] opacity-80 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#3b82f6] mb-0.5 truncate">Resultado Neto</p>
              <p className={`text-lg xl:text-xl font-bold truncate ${neto >= 0 ? "text-green-400" : "text-red-400"}`}>
                {neto >= 0 ? "+" : ""}{formatMoney(neto)}
              </p>
            </div>
          </div>

          <div className="bg-[#150B16] border border-[#d946ef]/30 rounded-xl p-4 flex items-center gap-3 sm:gap-4 shadow-lg overflow-hidden transition-all">
            <Star size={32} className="text-[#d946ef] opacity-80 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#d946ef] mb-0.5 truncate">Mayor Premio</p>
              <p className="text-lg xl:text-xl font-bold text-white truncate">{formatMoney(mayorPremio)}</p>
            </div>
          </div>

        </div>

        {error && (
          <p className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">{error}</p>
        )}

        {/* TABLA DE RESULTADOS DINÁMICA */}
        <div className="bg-[#0B0E14] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar min-h-[400px]">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10 bg-[#131722]/50">
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Fecha</th>
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Juego</th>
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Apuesta</th>
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Premio</th>
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Neto</th>
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Estado</th>
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cargando ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <RefreshCw size={28} className="mb-4 animate-spin text-[#8A2BE2]" />
                        <p className="text-sm">Cargando tus resultados…</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredResults.length > 0 ? (
                  filteredResults.map((row) => (
                    <tr key={row.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="py-4 px-6 text-sm text-gray-400 whitespace-nowrap">
                        {formatDate(row.creado_at)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-[#131722] border border-white/10 flex items-center justify-center shrink-0">
                            <Gamepad2 size={16} className="text-[#a855f7]" />
                          </div>
                          <span className="text-sm font-medium text-gray-200">
                            {nombrePorId[row.juego_id] ?? "Juego del catálogo"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-300 font-mono">{formatMoney(row.apuesta_mxn)}</td>
                      <td className="py-4 px-6 text-sm text-gray-200 font-mono">
                        {row.premio_mxn > 0 ? formatMoney(row.premio_mxn) : "—"}
                      </td>
                      <td className={`py-4 px-6 text-sm font-mono ${row.neto_mxn > 0 ? "text-green-400" : row.neto_mxn < 0 ? "text-red-400" : "text-gray-400"}`}>
                        {row.neto_mxn > 0 ? "+" : ""}{formatMoney(row.neto_mxn)}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={
                          row.estado === "resuelta" ? "text-green-500 font-medium"
                          : row.estado === "abierta" ? "text-yellow-500 font-medium"
                          : "text-gray-500 font-medium"
                        }>
                          {row.estado === "resuelta" ? "Resuelta" : row.estado === "abierta" ? "En curso" : "Anulada"}
                        </span>
                      </td>
                      {/*
                        El comprobante de juego justo. Con la semilla del
                        servidor revelada, cualquiera puede recalcular la ronda y
                        comprobar que el resultado no se reescribió después de
                        ver la apuesta.
                      */}
                      <td className="py-4 px-6 text-[11px] text-gray-500 font-mono" title={row.equidad.como_verificar}>
                        {row.equidad.semilla_servidor
                          ? `${row.equidad.semilla_servidor_hash.slice(0, 10)}… · nonce ${row.equidad.nonce}`
                          : "Sin revelar"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <CircleDashed size={40} className="mb-4 opacity-30" />
                        <p className="text-sm">Todavía no has jugado ninguna ronda.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}