"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

// Lista oficial de juegos basada en el recorrido del casino
const GAMES = [
  {
    slug: "tragamonedas",
    nombre: "Tragamonedas",
    descripcion: "Acceso libre (Gratis)",
    imagenFondo: "/tragamonedas.png",
    colorAcento: "bg-yellow-500"
  },
  {
    slug: "ruleta",
    nombre: "Ruleta",
    descripcion: "Requiere Notificaciones",
    imagenFondo: "/ruleta.png",
    colorAcento: "bg-orange-500"
  },
  {
    slug: "rasca-y-gana",
    nombre: "Rasca y Gana",
    descripcion: "Acceso libre",
    imagenFondo: "/rasca.png",
    colorAcento: "bg-emerald-500"
  },
  {
    slug: "blackjack-vip",
    nombre: "Blackjack VIP",
    descripcion: "Requiere Ubicación",
    imagenFondo: "/blackjack-vip.png",
    colorAcento: "bg-red-500"
  },
  {
    slug: "mesa-en-vivo",
    nombre: "Mesa en Vivo",
    descripcion: "Requiere Micrófono",
    imagenFondo: "/mesa-en-vivo.png",
    colorAcento: "bg-blue-500"
  },
  {
    slug: "sala-vip",
    nombre: "Sala VIP",
    descripcion: "Requiere Acceso Total",
    imagenFondo: "/sala-vip.png",
    colorAcento: "bg-[#D4AF37]"
  },
];

export default function JuegosPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // El "cadenero" de los clics
  const handleGameAction = (slug: string) => {
    if (!user) {
      router.push("/login");
    } else {
      router.push(`/juegos/${slug}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] max-w-[1600px] mx-auto pb-12 px-4 sm:px-6 lg:px-8">
      
      {/* Cabecera de la sección */}
      <div className="mb-10 text-center sm:text-left mt-8">
        <p className="text-[#D4AF37] text-[10px] font-bold tracking-widest uppercase mb-3 flex items-center justify-center sm:justify-start gap-2">
          <ShieldAlert size={14} /> Piso de juego seguro
        </p>
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
          Elige tu mesa
        </h1>
        <p className="max-w-2xl text-sm text-gray-400 leading-relaxed mx-auto sm:mx-0">
          Cada mesa pide un permiso real de tu dispositivo antes de dejarte jugar. 
          Acepta o rechaza sin miedo: es parte del recorrido para conocer cómo 
          interactúan las aplicaciones con tu información. Tus fichas están seguras.
        </p>
      </div>

      {/* Cuadrícula de Juegos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {GAMES.map((game) => (
          <div
            key={game.slug}
            onClick={() => handleGameAction(game.slug)}
            className="cursor-pointer group relative block rounded-3xl overflow-hidden bg-[#0B0E14] border border-white/5 hover:border-[#D4AF37]/50 transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] h-64 sm:h-72"
          >
            {/* Imagen de Fondo con Zoom */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url(${game.imagenFondo})` }}
            ></div>
            
            {/* Degradado oscuro para que el texto resalte */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-[#05050A]/70 to-transparent pointer-events-none"></div>
            
            {/* Contenido de la Tarjeta */}
            <div className="absolute bottom-0 w-full p-6 sm:p-8 flex flex-col justify-end">
              <h2 className="font-bold text-2xl text-white mb-2 group-hover:text-[#D4AF37] transition-colors">
                {game.nombre}
              </h2>
              
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${game.colorAcento} shadow-[0_0_8px_currentColor]`}></span>
                <p className="font-medium text-xs text-gray-300 uppercase tracking-widest">
                  {game.descripcion}
                </p>
              </div>

              {/* Botón flotante oculto que aparece en hover */}
              <div className="mt-4 overflow-hidden h-0 group-hover:h-10 transition-all duration-300 opacity-0 group-hover:opacity-100">
                <span className="inline-block bg-[#3B2063] text-white text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg">
                  Entrar a la sala →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}