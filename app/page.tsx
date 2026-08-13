"use client";

import { useEffect, useState } from "react";
import { Users, Dice5, Wallet, TrendingUp, Activity, CheckCircle2, Trophy, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { useCatalogoStore } from "@/lib/catalogoStore";
import { SALAS, salaDe } from "@/lib/salas";

// Escenografía del casino: cifras de adorno que no vienen de ningún endpoint.
// El backend no modela caja ni jugadores concurrentes, y fingir que sí sería
// justo el tipo de dato inventado que este laboratorio enseña a mirar con dudas.
const SIMULATED_FINANCES = { pagosHoy: "$1,245,780", gananciasHoy: "$2,987,540" };
const SIMULATED_STATS = { usuariosActivos: "24,531", sesionesActivas: "8,745" };

const RECENT_ACTIVITY = [
  { id: 1, type: "Depósito aprobado", desc: "Tarjeta **** 4567", amount: "$ 3,000 MXN", time: "Hace 5 min", color: "text-green-400" },
  { id: 2, type: "Retiro aprobado", desc: "SPEI **** 7890", amount: "$ 2,500 MXN", time: "Hace 15 min", color: "text-green-400" },
  { id: 3, type: "Bono otorgado", desc: "Bono de Bienvenida", amount: "$ 5,000 MXN", time: "Hace 30 min", color: "text-red-400" },
];

const WINNERS = [
  { id: 1, name: "Ana López", game: "Blackjack VIP", amount: "$ 25,000 MXN", img: "bg-red-900" },
  { id: 2, name: "Miguel Rojas", game: "Ruleta", amount: "$ 18,750 MXN", img: "bg-blue-900" },
  { id: 3, name: "Laura Torres", game: "Tragamonedas", amount: "$ 12,500 MXN", img: "bg-yellow-900" },
];


export default function Home() {
  const router = useRouter();
  const { user } = useAuthStore();

  const handleProtectedAction = (path: string) => {
    if (!user) {
      router.push("/login");
    } else {
      router.push(path);
    }
  };

  // El catálogo de juegos es real (GET /juegos); el resto del tablero sigue
  // siendo escenografía del casino y está marcado como tal.
  const juegos = useCatalogoStore((s) => s.juegos);
  const cargarCatalogo = useCatalogoStore((s) => s.cargar);
  const cargandoCatalogo = useCatalogoStore((s) => s.cargando);

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    if (user) void cargarCatalogo();
  }, [user, cargarCatalogo]);

  const games = juegos.filter((juego) => juego.slug in SALAS);
  const isLoading = cargandoCatalogo && juegos.length === 0;

  const STATS_CARDS = [
    { id: 1, label: "USUARIOS ACTIVOS", value: SIMULATED_STATS.usuariosActivos, trend: "Escenografía", icon: Users, color: "text-[#8A2BE2]" },
    { id: 2, label: "JUEGOS DISPONIBLES", value: juegos.length.toLocaleString(), trend: "Catálogo del backend", icon: Dice5, color: "text-red-500" },
    { id: 3, label: "PAGOS HOY", value: SIMULATED_FINANCES.pagosHoy, trend: "Escenografía", icon: Wallet, color: "text-blue-500" },
    { id: 4, label: "GANANCIAS HOY", value: SIMULATED_FINANCES.gananciasHoy, trend: "Escenografía", icon: TrendingUp, color: "text-cyan-400" },
    { id: 5, label: "SESIONES ACTIVAS", value: SIMULATED_STATS.sesionesActivas, trend: "Escenografía", icon: Activity, color: "text-[#8A2BE2]" },
  ];

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto px-4 sm:px-6 pb-10 pt-4">
      
      {/* Banners */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 relative rounded-3xl border border-white/10 p-10 overflow-hidden flex items-center justify-between shadow-[0_0_40px_rgba(138,43,226,0.05)] group bg-[#0B0E14]">
          <div className="absolute inset-0 bg-[url('/fondo.png')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#1E1133]/90 via-[#1E1133]/40 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10">
            <p className="text-[#D4AF37] font-bold tracking-widest text-[10px] mb-4 uppercase drop-shadow-md">
              Bono de Bienvenida
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-2 text-white drop-shadow-lg">
              100% <span className="text-gray-200 text-3xl font-normal">HASTA</span><br/>
              <span className="text-[#D4AF37] text-5xl lg:text-6xl drop-shadow-lg">$5,000 MXN</span>
            </h1>
            <p className="text-gray-200 mb-8 text-xl font-medium tracking-wide drop-shadow-md">
              + 200 GIROS GRATIS
            </p>
            <button 
              onClick={() => handleProtectedAction("/cajero")}
              className="bg-gradient-to-r from-[#D4AF37] to-[#F3D55B] hover:from-[#F3D55B] hover:to-[#FFF1A0] text-black font-bold py-3.5 px-10 rounded-xl transition-all shadow-[0_4px_15px_rgba(212,175,55,0.2)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.3)]"
            >
              RECLAMAR BONO
            </button>
          </div>
        </div>

        <div className="bg-[#0B0E14]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#8A2BE2]/10 blur-3xl rounded-full pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-[10px] tracking-widest uppercase mb-4">
              <Trophy size={16} /> <span>Torneo del día</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Gran Torneo Royal</h3>
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Premio Total</p>
            <p className="text-3xl font-bold text-[#D4AF37] mb-8">$150,000 MXN</p>
            <div className="flex gap-3 mb-8">
              <div className="bg-[#131722] rounded-xl px-4 py-3 border border-white/5 text-center flex-1 shadow-inner">
                <span className="block text-2xl font-bold text-white">05</span><span className="text-[10px] text-gray-500 uppercase tracking-wider">Horas</span>
              </div>
              <div className="bg-[#131722] rounded-xl px-4 py-3 border border-white/5 text-center flex-1 shadow-inner">
                <span className="block text-2xl font-bold text-white">32</span><span className="text-[10px] text-gray-500 uppercase tracking-wider">Min</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => handleProtectedAction("/torneos")}
            className="w-full relative z-10 bg-[#3B2063] hover:bg-[#4A297C] text-white font-bold py-3.5 rounded-xl transition-colors text-sm shadow-lg"
          >
            VER TORNEO
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className={`grid grid-cols-2 lg:grid-cols-5 gap-4 transition-opacity duration-500 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        {STATS_CARDS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className="bg-[#0B0E14]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors shadow-lg">
              <div className="flex items-center gap-4 mb-3">
                <Icon size={24} className={stat.color} />
                <div>
                  <h3 className="text-gray-400 text-[10px] font-bold tracking-wider uppercase mb-1">{stat.label}</h3>
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                </div>
              </div>
              <p className="text-xs text-green-500 font-medium">{stat.trend}</p>
            </div>
          );
        })}
      </div>

      {/* Juegos Populares */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-sm font-bold tracking-widest text-white uppercase">Juegos Populares</h2>
          <button 
            onClick={() => router.push("/juegos")}
            className="text-[11px] font-medium text-gray-400 border border-white/10 rounded-full px-4 py-1.5 hover:text-white hover:border-[#8A2BE2] transition-colors"
          >
            VER TODOS
          </button>
        </div>
        
        {isLoading ? (
          <div className="h-40 flex items-center justify-center text-gray-500 text-sm">Cargando mesas...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {games.map((game) => (
              <div 
                key={game.id} 
                onClick={() => handleProtectedAction(`/juegos/${game.slug}`)}
                className="cursor-pointer group relative block rounded-2xl overflow-hidden bg-[#0B0E14] border border-white/5 hover:border-[#D4AF37]/50 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] text-left"
              >
                {/* Forzamos el aspecto 4/3 para que no se estiren verticalmente */}
                <div
                  className="w-full aspect-[4/3] bg-cover bg-center opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${salaDe(game.slug).imagenFondo})` }}
                ></div>
                <div className="p-4 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/90 to-transparent absolute bottom-0 w-full pt-16">
                  <h3 className="font-bold text-sm text-white truncate" title={game.nombre}>{game.nombre}</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate uppercase tracking-wide" title={game.descripcion}>
                    {salaDe(game.slug).requisito}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid inferior: Ganadores, Actividad, Promos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#0B0E14]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-6 shadow-lg">
          <h2 className="text-[10px] font-bold tracking-widest mb-6 text-gray-400 uppercase">Últimos Ganadores</h2>
          <div className="space-y-5">
            {WINNERS.map((winner) => (
              <div key={winner.id} className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${winner.img} border border-white/10 shadow-inner group-hover:scale-105 transition-transform`}></div>
                  <div>
                    <p className="text-sm font-bold text-white">{winner.name}</p>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide mt-0.5">{winner.game}</p>
                  </div>
                </div>
                <span className="text-green-400 text-sm font-bold">{winner.amount}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0B0E14]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-6 shadow-lg">
          <h2 className="text-[10px] font-bold tracking-widest mb-6 text-gray-400 uppercase">Actividad Reciente</h2>
          <div className="space-y-5">
            {RECENT_ACTIVITY.map((activity) => (
              <div key={activity.id} className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1E1133] flex items-center justify-center text-gray-400 border border-[#8A2BE2]/20 group-hover:bg-[#3B2063] transition-colors">
                    <CheckCircle2 size={18} className="text-[#8A2BE2] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{activity.type}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{activity.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`${activity.color} text-sm font-bold`}>{activity.amount}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5 uppercase tracking-wide">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0B0E14]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-6 shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Promociones Activas</h2>
            <button 
              onClick={() => handleProtectedAction("/promociones")}
              className="text-[10px] text-[#8A2BE2] hover:text-purple-400 transition-colors font-medium uppercase tracking-wider"
            >
              Ver todas
            </button>
          </div>
          <div className="space-y-4">
            <div className="bg-[#131722] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-900 to-[#1E1133] rounded-xl shrink-0 border border-white/5 shadow-inner"></div>
              <div>
                <h3 className="text-[#D4AF37] text-[11px] font-bold mb-1 uppercase tracking-widest">Cashback Semanal</h3>
                <p className="text-xs text-gray-400 mb-2 leading-tight">Recibe hasta 15% de vuelta en tus pérdidas.</p>
                <button 
                  onClick={() => handleProtectedAction("/promociones")}
                  className="text-[10px] font-bold text-white uppercase tracking-wider hover:text-[#D4AF37] transition-colors"
                >
                  Más Info →
                </button>
              </div>
            </div>
            <div className="bg-[#131722] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-900 to-[#1E1133] rounded-xl shrink-0 border border-white/5 shadow-inner"></div>
              <div>
                <h3 className="text-[#D4AF37] text-[11px] font-bold mb-1 uppercase tracking-widest">Recarga y Gana</h3>
                <p className="text-xs text-gray-400 mb-2 leading-tight">Recarga $1,000 o más y recibe 50 giros gratis.</p>
                <button 
                  onClick={() => handleProtectedAction("/promociones")}
                  className="text-[10px] font-bold text-white uppercase tracking-wider hover:text-[#D4AF37] transition-colors"
                >
                  Más Info →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* El banner de cookies vivía aquí y solo escribía una bandera en
          localStorage. Ahora el aviso lo muestra <ConsentBanner /> desde el
          layout y lo registra con POST /consentimientos, midiendo cuánto tarda
          el participante en decidir: es el dato central del laboratorio y no
          podía quedarse en el navegador. */}

      {showPrivacyModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0F111A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Política de Privacidad y Cookies</h2>
              <button onClick={() => setShowPrivacyModal(false)} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-gray-300 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
              <p><strong>1. Uso de Cookies</strong><br/>Las cookies son pequeños archivos de texto que se almacenan en su dispositivo...</p>
              <p><strong>2. Recopilación de información</strong><br/>Recopilamos información personal proporcionada durante el registro...</p>
              <p><strong>3. Permisos y Datos del Dispositivo</strong><br/>Dependiendo de las áreas a las que acceda dentro de la plataforma...</p>
              <p><strong>4. Uso de la información</strong><br/>Utilizamos sus datos para gestionar su cuenta...</p>
              <p><strong>5. Sus derechos</strong><br/>Usted tiene derecho a acceder, corregir o revocar los permisos...</p>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end bg-[#0B0E14]">
              <button onClick={() => setShowPrivacyModal(false)} className="bg-[#3B2063] hover:bg-[#4A297C] text-white px-6 py-2 rounded-lg transition-colors font-medium text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}