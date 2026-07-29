"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Dice5, Wallet, TrendingUp, Activity, CheckCircle2, Trophy } from "lucide-react";
import { fetchApi } from "@/lib/api";

// --- DATOS SIMULADOS (Para lo que no existe en BD) ---
const SIMULATED_FINANCES = {
  pagosHoy: "$1,245,780",
  gananciasHoy: "$2,987,540",
};

const RECENT_ACTIVITY = [
  { id: 1, type: "Depósito aprobado", desc: "Tarjeta **** 4567", amount: "$ 3,000 MXN", time: "Hace 5 min", color: "text-green-400" },
  { id: 2, type: "Retiro aprobado", desc: "SPEI **** 7890", amount: "$ 2,500 MXN", time: "Hace 15 min", color: "text-green-400" },
  { id: 3, type: "Bono otorgado", desc: "Bono de Bienvenida", amount: "$ 5,000 MXN", time: "Hace 30 min", color: "text-red-400" },
];

const WINNERS = [
  { id: 1, name: "Ana López", game: "Blackjack", amount: "$ 25,000 MXN", img: "bg-red-900" },
  { id: 2, name: "Miguel Rojas", game: "Ruleta en Vivo", amount: "$ 18,750 MXN", img: "bg-blue-900" },
  { id: 3, name: "Laura Torres", game: "Tragamonedas", amount: "$ 12,500 MXN", img: "bg-yellow-900" },
];

// Fallback de juegos por si el backend está vacío o desconectado
const FALLBACK_GAMES = [
  { id: "g1", slug: "blackjack", nombre: "Blackjack", descripcion: "124 mesas", img: "bg-green-900" },
  { id: "g2", slug: "ruleta", nombre: "Ruleta en Vivo", descripcion: "89 mesas", img: "bg-orange-900" },
];

export default function Home() {
  const [stats, setStats] = useState({
    usuariosActivos: 24531, // Valores iniciales simulados
    juegosDisponibles: 128,
    sesionesActivas: 8745,
  });
  const [games, setGames] = useState<any[]>(FALLBACK_GAMES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        // Ejecutamos las peticiones en paralelo para mayor velocidad
        // Usamos .catch en cada una para que un error de permisos (ej. un participante no puede ver /usuarios)
        // no rompa la ejecución de las demás peticiones.
        const [resJuegos, resUsuarios, resSesiones] = await Promise.all([
          fetchApi("/juegos?solo_activos=true").catch(() => null),
          fetchApi("/usuarios?estado=activo").catch(() => null),
          fetchApi("/sesiones?estado=activa").catch(() => null),
        ]);

        if (!isMounted) return;

        // Actualizamos los juegos si la API responde correctamente
        if (resJuegos && resJuegos.juegos) {
          // Mapeamos los juegos de la BD para inyectarles colores simulados para las portadas
          const colors = ["bg-green-900", "bg-orange-900", "bg-yellow-900", "bg-red-900", "bg-emerald-900", "bg-blue-900"];
          const mappedGames = resJuegos.juegos.map((juego: any, index: number) => ({
            ...juego,
            img: colors[index % colors.length]
          }));
          setGames(mappedGames.length > 0 ? mappedGames : FALLBACK_GAMES);
        }

        // Actualizamos estadísticas con los totales reales si existen
        setStats(prev => ({
          usuariosActivos: resUsuarios?.paginacion?.total ?? prev.usuariosActivos,
          juegosDisponibles: resJuegos?.paginacion?.total ?? prev.juegosDisponibles,
          sesionesActivas: resSesiones?.paginacion?.total ?? prev.sesionesActivas,
        }));

      } catch (error) {
        console.error("Error al cargar los datos del dashboard:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Construcción dinámica de la lista de estadísticas
  const STATS_CARDS = [
    { id: 1, label: "USUARIOS ACTIVOS", value: stats.usuariosActivos.toLocaleString(), trend: "Conectados", icon: Users, color: "text-[#8A2BE2]" },
    { id: 2, label: "JUEGOS DISPONIBLES", value: stats.juegosDisponibles.toLocaleString(), trend: "Catálogo completo", icon: Dice5, color: "text-red-500" },
    { id: 3, label: "PAGOS HOY", value: SIMULATED_FINANCES.pagosHoy, trend: "+ 18% vs ayer", icon: Wallet, color: "text-blue-500" },
    { id: 4, label: "GANANCIAS HOY", value: SIMULATED_FINANCES.gananciasHoy, trend: "+ 9% vs ayer", icon: TrendingUp, color: "text-cyan-400" },
    { id: 5, label: "SESIONES ACTIVAS", value: stats.sesionesActivas.toLocaleString(), trend: "En este momento", icon: Activity, color: "text-[#8A2BE2]" },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* Grid superior: Banners */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Banner */}
        <div className="xl:col-span-2 relative rounded-2xl bg-gradient-to-r from-[#1E1133] to-[#0B0E14] border border-white/5 p-10 overflow-hidden flex items-center justify-between shadow-lg">
          <div className="relative z-10">
            <p className="text-[#D4AF37] font-semibold tracking-wider text-sm mb-4 uppercase">
              BONO DE BIENVENIDA
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-2 text-white">
              100% <span className="text-gray-300 text-3xl font-normal">HASTA</span><br/>
              <span className="text-[#D4AF37] text-5xl lg:text-6xl">$5,000 MXN</span>
            </h1>
            <p className="text-gray-300 mb-8 text-xl">
              + 200 GIROS GRATIS
            </p>
            <button className="bg-[#D4AF37] hover:bg-[#F3D55B] text-black font-bold py-3 px-8 rounded flex items-center gap-2 transition-colors">
              RECLAMAR BONO
            </button>
          </div>
        </div>

        {/* Torneo Banner */}
        <div className="bg-[#141722] border border-white/5 rounded-2xl p-8 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-sm mb-4">
              <Trophy size={18} />
              <span>TORNEO DEL DÍA</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Gran Torneo Royal</h3>
            <p className="text-sm text-gray-400 mb-2">Premio Total</p>
            <p className="text-3xl font-bold text-[#D4AF37] mb-8">$150,000 MXN</p>
            
            <div className="flex gap-3 mb-8">
              <div className="bg-[#0B0E14] rounded-lg px-4 py-3 border border-white/5 text-center flex-1">
                <span className="block text-2xl font-bold text-white">05</span>
                <span className="text-[10px] text-gray-500 uppercase">Horas</span>
              </div>
              <div className="bg-[#0B0E14] rounded-lg px-4 py-3 border border-white/5 text-center flex-1">
                <span className="block text-2xl font-bold text-white">32</span>
                <span className="text-[10px] text-gray-500 uppercase">Min</span>
              </div>
            </div>
          </div>
          <button className="w-full bg-[#3B2063] hover:bg-[#4A297C] text-white font-medium py-3 rounded transition-colors text-sm">
            VER TORNEO
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className={`grid grid-cols-2 lg:grid-cols-5 gap-4 transition-opacity duration-500 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        {STATS_CARDS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className="bg-[#141722] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-4 mb-3">
                <Icon size={28} className={stat.color} />
                <div>
                  <h3 className="text-gray-400 text-[10px] font-semibold tracking-wider uppercase mb-1">{stat.label}</h3>
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                </div>
              </div>
              <p className="text-xs text-green-500 font-medium">{stat.trend}</p>
            </div>
          );
        })}
      </div>

      {/* Juegos Populares (Desde el Catálogo de la BD) */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-sm font-semibold tracking-wide text-gray-300">JUEGOS POPULARES</h2>
          <button className="text-xs text-gray-400 border border-white/10 rounded-full px-4 py-1.5 hover:text-white hover:border-white/30 transition-colors">
            VER TODOS
          </button>
        </div>
        
        {isLoading ? (
          <div className="h-40 flex items-center justify-center text-gray-500 text-sm">Cargando mesas...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {games.map((game) => (
              <Link href={`/juegos/${game.slug}`} key={game.id} className="group relative block rounded-xl overflow-hidden bg-[#141722] border border-white/5 hover:border-[#D4AF37]/50 transition-all">
                {/* Portada dinámica simulada con color */}
                <div className={`w-full aspect-[4/3] ${game.img} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
                <div className="p-4">
                  <h3 className="font-medium text-sm text-white truncate" title={game.nombre}>{game.nombre}</h3>
                  <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1 truncate" title={game.descripcion || game.tecnologia_demo}>
                    {game.descripcion || "Mesa VIP"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Grid inferior: Ganadores, Actividad, Promos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Últimos Ganadores (Simulado) */}
        <div className="bg-[#141722] border border-white/5 rounded-xl p-6">
          <h2 className="text-[11px] font-semibold tracking-wider mb-6 text-gray-400 uppercase">ÚLTIMOS GANADORES</h2>
          <div className="space-y-5">
            {WINNERS.map((winner) => (
              <div key={winner.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${winner.img}`}></div>
                  <div>
                    <p className="text-sm font-medium text-white">{winner.name}</p>
                    <p className="text-xs text-gray-500">{winner.game}</p>
                  </div>
                </div>
                <span className="text-green-400 text-sm font-semibold">{winner.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actividad Reciente (Simulado) */}
        <div className="bg-[#141722] border border-white/5 rounded-xl p-6">
          <h2 className="text-[11px] font-semibold tracking-wider mb-6 text-gray-400 uppercase">ACTIVIDAD RECIENTE</h2>
          <div className="space-y-5">
            {RECENT_ACTIVITY.map((activity) => (
              <div key={activity.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[#1E1133] flex items-center justify-center text-gray-400">
                    <CheckCircle2 size={18} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{activity.type}</p>
                    <p className="text-xs text-gray-500">{activity.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`${activity.color} text-sm font-semibold`}>{activity.amount}</p>
                  <p className="text-[11px] text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Promociones Activas */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">PROMOCIONES ACTIVAS</h2>
            <button className="text-[10px] text-gray-400 border border-white/10 rounded-full px-3 py-1 hover:text-white hover:border-white/30 transition-colors">
              VER TODAS
            </button>
          </div>
          <div className="space-y-4">
            <div className="bg-[#141722] border border-white/5 rounded-xl p-4 flex items-center gap-4">
              <div className="w-20 h-24 bg-purple-900 rounded-lg shrink-0"></div>
              <div>
                <h3 className="text-[#D4AF37] text-xs font-bold mb-1">CASHBACK SEMANAL</h3>
                <p className="text-[11px] text-gray-400 mb-3 leading-tight">Recibe hasta 15% de vuelta en tus pérdidas semanales.</p>
                <button className="bg-[#1E1133] hover:bg-[#2B1847] text-white text-[10px] font-medium px-4 py-1.5 rounded transition-colors border border-[#8A2BE2]/30">
                  MÁS INFO
                </button>
              </div>
            </div>
            <div className="bg-[#141722] border border-white/5 rounded-xl p-4 flex items-center gap-4">
              <div className="w-20 h-24 bg-yellow-900 rounded-lg shrink-0"></div>
              <div>
                <h3 className="text-[#D4AF37] text-xs font-bold mb-1">RECARGA Y GANA</h3>
                <p className="text-[11px] text-gray-400 mb-3 leading-tight">Recarga $1,000 o más y recibe 50 giros gratis.</p>
                <button className="bg-[#1E1133] hover:bg-[#2B1847] text-white text-[10px] font-medium px-4 py-1.5 rounded transition-colors border border-[#8A2BE2]/30">
                  MÁS INFO
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}