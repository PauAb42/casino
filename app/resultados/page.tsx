"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar, ChevronDown, Gamepad2, Coins, Trophy, 
  TrendingUp, Star, ChevronRight, CircleDashed, 
  LayoutGrid, Spade, Ticket 
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

// Datos de prueba con fechas en formato ISO real para poder filtrarlas
const MOCK_RESULTS = [
  { id: 1, rawDate: "2026-08-01T23:45:12", juego: "Ruleta", detalle: "Rojo · 25", apuesta: 100.00, resultado: "Perdida", ganancia: -100.00, icon: CircleDashed, color: "text-red-400" },
  { id: 2, rawDate: "2026-08-01T23:42:03", juego: "Tragamonedas", detalle: "5 Diamantes", apuesta: 50.00, resultado: "Ganancia", ganancia: 1250.00, icon: LayoutGrid, color: "text-yellow-400" },
  { id: 3, rawDate: "2026-08-01T23:38:51", juego: "Blackjack", detalle: "21 puntos", apuesta: 200.00, resultado: "Ganancia", ganancia: 200.00, icon: Spade, color: "text-gray-300" },
  { id: 4, rawDate: "2026-07-30T15:35:10", juego: "Rasca y Gana", detalle: "Premio medio", apuesta: 100.00, resultado: "Ganancia", ganancia: 250.00, icon: Ticket, color: "text-[#D4AF37]" },
  { id: 5, rawDate: "2026-07-28T20:31:44", juego: "Ruleta", detalle: "Negro · 17", apuesta: 150.00, resultado: "Perdida", ganancia: -150.00, icon: CircleDashed, color: "text-red-400" },
  { id: 6, rawDate: "2026-07-25T18:28:22", juego: "Tragamonedas", detalle: "3 7 seguidos", apuesta: 75.00, resultado: "Ganancia", ganancia: 375.00, icon: LayoutGrid, color: "text-yellow-400" },
  { id: 7, rawDate: "2026-07-20T21:24:05", juego: "Blackjack", detalle: "Bust", apuesta: 200.00, resultado: "Perdida", ganancia: -200.00, icon: Spade, color: "text-gray-300" },
  { id: 8, rawDate: "2026-07-15T19:18:37", juego: "Rasca y Gana", detalle: "Sin premio", apuesta: 50.00, resultado: "Perdida", ganancia: -50.00, icon: Ticket, color: "text-[#D4AF37]" },
  { id: 9, rawDate: "2026-07-10T14:10:00", juego: "Tragamonedas", detalle: "Giros Gratis", apuesta: 20.00, resultado: "Ganancia", ganancia: 120.00, icon: LayoutGrid, color: "text-yellow-400" },
];

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
  const { user } = useAuthStore();

  // Estados de Filtros
  const [selectedGame, setSelectedGame] = useState("Todos");
  const [startDate, setStartDate] = useState("2026-07-01");
  const [endDate, setEndDate] = useState("2026-08-01");

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  // Filtrado y cálculo dinámico usando useMemo para optimizar rendimiento
  const filteredResults = useMemo(() => {
    return MOCK_RESULTS.filter((item) => {
      const itemDate = new Date(item.rawDate);
      const start = new Date(startDate + "T00:00:00");
      const end = new Date(endDate + "T23:59:59");
      
      const isWithinDate = itemDate >= start && itemDate <= end;
      const isMatchingGame = selectedGame === "Todos" || item.juego === selectedGame;

      return isWithinDate && isMatchingGame;
    });
  }, [selectedGame, startDate, endDate]);

  // Cálculos dinámicos para las tarjetas
  const rondasJugadas = filteredResults.length;
  const apuestadoTotal = filteredResults.reduce((acc, curr) => acc + curr.apuesta, 0);
  const gananciaTotal = filteredResults.reduce((acc, curr) => curr.ganancia > 0 ? acc + curr.ganancia : acc, 0);
  const gananciaNeta = filteredResults.reduce((acc, curr) => acc + curr.ganancia, 0);
  const mayorPremio = filteredResults.length > 0 ? Math.max(...filteredResults.map(d => d.ganancia)) : 0;

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
              Consulta tu historial de juegos, ganancias y transacciones.
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
              <select 
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full bg-transparent text-sm text-gray-300 focus:outline-none appearance-none cursor-pointer pr-8 [&>option]:bg-[#0F131D]"
              >
                <option value="Todos">Todos los juegos</option>
                <option value="Tragamonedas">Tragamonedas</option>
                <option value="Ruleta">Ruleta</option>
                <option value="Blackjack">Blackjack</option>
                <option value="Rasca y Gana">Rasca y Gana</option>
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
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#22c55e] mb-0.5 truncate">Apuestado Total</p>
              <p className="text-lg xl:text-xl font-bold text-white truncate">{formatMoney(apuestadoTotal)}</p>
            </div>
          </div>

          <div className="bg-[#17130B] border border-[#eab308]/30 rounded-xl p-4 flex items-center gap-3 sm:gap-4 shadow-lg overflow-hidden transition-all">
            <Trophy size={32} className="text-[#eab308] opacity-80 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#eab308] mb-0.5 truncate">Ganancia Total</p>
              <p className="text-lg xl:text-xl font-bold text-white truncate">{formatMoney(gananciaTotal)}</p>
            </div>
          </div>

          <div className="bg-[#0B121A] border border-[#3b82f6]/30 rounded-xl p-4 flex items-center gap-3 sm:gap-4 shadow-lg overflow-hidden transition-all">
            <TrendingUp size={32} className="text-[#3b82f6] opacity-80 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#3b82f6] mb-0.5 truncate">Ganancia Neta</p>
              <p className={`text-lg xl:text-xl font-bold truncate ${gananciaNeta >= 0 ? 'text-white' : 'text-red-400'}`}>
                {gananciaNeta < 0 ? "-" : ""}{formatMoney(Math.abs(gananciaNeta))}
              </p>
            </div>
          </div>

          <div className="bg-[#150B16] border border-[#d946ef]/30 rounded-xl p-4 flex items-center gap-3 sm:gap-4 shadow-lg overflow-hidden transition-all">
            <Star size={32} className="text-[#d946ef] opacity-80 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#d946ef] mb-0.5 truncate">Mayor Premio</p>
              <p className="text-lg xl:text-xl font-bold text-white truncate">{formatMoney(mayorPremio < 0 ? 0 : mayorPremio)}</p>
            </div>
          </div>
          
        </div>

        {/* TABLA DE RESULTADOS DINÁMICA */}
        <div className="bg-[#0B0E14] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar min-h-[400px]">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10 bg-[#131722]/50">
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Fecha y Hora</th>
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Juego</th>
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Detalle</th>
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Apuesta</th>
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Resultado</th>
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">Ganancia</th>
                  <th className="py-5 px-6 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredResults.length > 0 ? (
                  filteredResults.map((row) => {
                    const isWin = row.resultado === "Ganancia";
                    const Icon = row.icon;
                    
                    return (
                      <tr key={row.id} className="hover:bg-white/[0.03] transition-colors group cursor-pointer">
                        <td className="py-4 px-6 text-sm text-gray-400 whitespace-nowrap">
                          {formatDate(row.rawDate)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#131722] border border-white/10 flex items-center justify-center shrink-0">
                              <Icon size={16} className={row.color} />
                            </div>
                            <span className="text-sm font-medium text-gray-200">{row.juego}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-300">
                          {row.detalle}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-200 font-mono">
                          {formatMoney(row.apuesta)}
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span className={isWin ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                            {row.resultado}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm font-bold font-mono">
                          <span className={isWin ? "text-green-500" : "text-red-500"}>
                            {isWin ? formatMoney(row.ganancia) : `-${formatMoney(Math.abs(row.ganancia))}`}
                          </span>
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
                        <p className="text-sm">No se encontraron resultados para los filtros seleccionados.</p>
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