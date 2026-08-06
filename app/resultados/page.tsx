"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, ChevronDown, Gamepad2, Coins, Trophy,
  TrendingUp, Star, ChevronRight, CircleDashed,
  RefreshCw
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useCatalogoStore } from "@/lib/catalogoStore";
import { useLabStore } from "@/lib/labStore";
import { api } from "@/lib/api";
import type { InventarioDeResultados } from "@/lib/api";

/**
 * Historial de partidas de la sesión de laboratorio.
 *
 * `GET /resultados?sesion_id=` devuelve una fila por juego —`resultados` es único
 * por `(sesion_id, juego_id)`, un juego se juega una vez por sesión— con su
 * puntaje, si quedó completado y las métricas que la sala fue guardando. No hay
 * apuesta por ronda que listar: el backend modela el recorrido, no la caja.
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
  const router = useRouter();
  const { user, estado } = useAuthStore();
  const sesionId = useLabStore((s) => s.sesionId);
  const juegosPorSlug = useCatalogoStore((s) => s.porSlug);
  const cargarCatalogo = useCatalogoStore((s) => s.cargar);

  const [inventario, setInventario] = useState<InventarioDeResultados | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de Filtros
  const [selectedGame, setSelectedGame] = useState("Todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (estado === "anonimo") router.replace("/login");
  }, [estado, router]);

  useEffect(() => {
    void cargarCatalogo();
  }, [cargarCatalogo]);

  useEffect(() => {
    if (!sesionId) return;
    let vivo = true;

    (async () => {
      setCargando(true);
      try {
        const datos = await api.resultados.listar(sesionId);
        if (vivo) setInventario(datos);
      } catch (err) {
        if (vivo) setError(err instanceof Error ? err.message : "No se pudieron cargar tus resultados");
      } finally {
        if (vivo) setCargando(false);
      }
    })();

    return () => {
      vivo = false;
    };
  }, [sesionId]);

  // Nombre del juego por id: el resultado solo trae `juego_id`.
  const nombrePorId = useMemo(() => {
    const mapa: Record<string, string> = {};
    for (const juego of Object.values(juegosPorSlug)) mapa[juego.id] = juego.nombre;
    return mapa;
  }, [juegosPorSlug]);

  const filteredResults = useMemo(() => {
    const filas = inventario?.resultados ?? [];
    return filas.filter((fila) => {
      const fecha = new Date(fila.iniciado_at);
      if (startDate && fecha < new Date(startDate + "T00:00:00")) return false;
      if (endDate && fecha > new Date(endDate + "T23:59:59")) return false;
      if (selectedGame !== "Todos" && nombrePorId[fila.juego_id] !== selectedGame) return false;
      return true;
    });
  }, [inventario, selectedGame, startDate, endDate, nombrePorId]);

  // El resumen viene del backend; los filtros solo recortan la tabla.
  const rondasJugadas = filteredResults.length;
  const completados = filteredResults.filter((r) => r.completado).length;
  const puntajeTotal = filteredResults.reduce((acc, r) => acc + r.puntaje, 0);
  const mayorPuntaje = filteredResults.length > 0 ? Math.max(...filteredResults.map((r) => r.puntaje)) : 0;
  const enCurso = rondasJugadas - completados;

  if (!user) return <div className="min-h-screen bg-[#05050A]"></div>;

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
              Tus partidas de esta sesión de laboratorio, tal como quedaron registradas en el backend.
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
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#22c55e] mb-0.5 truncate">Puntaje Total</p>
              <p className="text-lg xl:text-xl font-bold text-white truncate">{formatMoney(puntajeTotal)}</p>
            </div>
          </div>

          <div className="bg-[#17130B] border border-[#eab308]/30 rounded-xl p-4 flex items-center gap-3 sm:gap-4 shadow-lg overflow-hidden transition-all">
            <Trophy size={32} className="text-[#eab308] opacity-80 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#eab308] mb-0.5 truncate">Completados</p>
              <p className="text-lg xl:text-xl font-bold text-white truncate">{completados}</p>
            </div>
          </div>

          <div className="bg-[#0B121A] border border-[#3b82f6]/30 rounded-xl p-4 flex items-center gap-3 sm:gap-4 shadow-lg overflow-hidden transition-all">
            <TrendingUp size={32} className="text-[#3b82f6] opacity-80 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#3b82f6] mb-0.5 truncate">En Curso</p>
              <p className="text-lg xl:text-xl font-bold text-white truncate">{enCurso}</p>
            </div>
          </div>

          <div className="bg-[#150B16] border border-[#d946ef]/30 rounded-xl p-4 flex items-center gap-3 sm:gap-4 shadow-lg overflow-hidden transition-all">
            <Star size={32} className="text-[#d946ef] opacity-80 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#d946ef] mb-0.5 truncate">Mayor Puntaje</p>
              <p className="text-lg xl:text-xl font-bold text-white truncate">{formatMoney(mayorPuntaje)}</p>
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
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Iniciado</th>
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Juego</th>
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Métricas</th>
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Puntaje</th>
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Estado</th>
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Cerrado</th>
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]"></th>
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
                  filteredResults.map((row) => {
                    const metricas = Object.entries(row.metricas ?? {})
                      .map(([clave, valor]) => `${clave}: ${String(valor)}`)
                      .join(" · ");

                    return (
                      <tr key={row.id} className="hover:bg-white/[0.03] transition-colors group cursor-pointer">
                        <td className="py-4 px-6 text-sm text-gray-400 whitespace-nowrap">
                          {formatDate(row.iniciado_at)}
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
                        <td className="py-4 px-6 text-sm text-gray-300 max-w-[280px] truncate" title={metricas}>
                          {metricas || "—"}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-200 font-mono">{row.puntaje}</td>
                        <td className="py-4 px-6 text-sm">
                          <span className={row.completado ? "text-green-500 font-medium" : "text-yellow-500 font-medium"}>
                            {row.completado ? "Completado" : "En curso"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-400 whitespace-nowrap">
                          {row.completado_at ? formatDate(row.completado_at) : "—"}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <ChevronRight size={18} className="text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <CircleDashed size={40} className="mb-4 opacity-30" />
                        <p className="text-sm">
                          {sesionId
                            ? "Todavía no jugaste nada en esta sesión de laboratorio."
                            : "Inicia sesión para abrir una sesión de laboratorio y registrar tus partidas."}
                        </p>
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