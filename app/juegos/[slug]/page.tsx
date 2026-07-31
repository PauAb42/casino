"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, ShieldAlert, Maximize2, Settings } from "lucide-react";

// Mapeo temporal para darle formato bonito al título dependiendo de la URL
const GAME_DETAILS: Record<string, { nombre: string; permiso: string; color: string }> = {
  "tragamonedas": { nombre: "Tragamonedas Clásica", permiso: "Ninguno (Acceso Libre)", color: "text-yellow-500" },
  "ruleta": { nombre: "Ruleta Europea", permiso: "Notificaciones", color: "text-orange-500" },
  "rasca-y-gana": { nombre: "Rasca y Gana", permiso: "Ninguno (Acceso Libre)", color: "text-emerald-500" },
  "blackjack-vip": { nombre: "Blackjack VIP", permiso: "Ubicación", color: "text-red-500" },
  "mesa-en-vivo": { nombre: "Mesa en Vivo", permiso: "Micrófono", color: "text-blue-500" },
  "sala-vip": { nombre: "Sala VIP Exclusiva", permiso: "Acceso Total", color: "text-purple-500" },
};

export default function GameRoom() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [isPlaying, setIsPlaying] = useState(false);

  // Obtener los detalles del juego actual, si no existe ponemos valores por defecto
  const gameInfo = GAME_DETAILS[slug] || { nombre: "Mesa Privada", permiso: "Verificando...", color: "text-[#D4AF37]" };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-[1600px] mx-auto pb-6">
      
      {/* Barra superior de la sala */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/")}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#131722] border border-white/5 hover:bg-[#1E1133] hover:border-[#8A2BE2]/50 text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">{gameInfo.nombre}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full bg-current ${gameInfo.color}`}></span>
              <p className="text-xs text-gray-400 uppercase tracking-widest">
                Requisito de sala: <span className="text-white font-medium">{gameInfo.permiso}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#131722] border border-white/5 text-gray-400 hover:text-white transition-colors text-sm font-medium">
            <Settings size={16} /> Configuración
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#131722] border border-white/5 text-gray-400 hover:text-white transition-colors text-sm font-medium">
            <Maximize2 size={16} /> Pantalla Completa
          </button>
        </div>
      </div>

      {/* Contenedor del Juego (Lienzo Central) */}
      <div className="flex-1 bg-[#05050A] border border-white/5 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col items-center justify-center">
        
        {/* Fondo decorativo del lienzo */}
        <div className="absolute inset-0 bg-[url('/images/bg-casino.jpg')] bg-cover bg-center opacity-10 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#05050A]/80 to-[#05050A] pointer-events-none"></div>

        {!isPlaying ? (
          <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 rounded-full bg-[#1E1133] border border-[#8A2BE2]/30 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(138,43,226,0.2)]">
              <Play size={40} className="text-[#D4AF37] ml-2" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 text-center">Mesa lista para jugar</h2>
            <p className="text-gray-400 text-sm mb-8 text-center max-w-md leading-relaxed">
              Estás a punto de ingresar a la zona de <span className="text-white">{gameInfo.nombre}</span>. Al iniciar la partida, se aplicarán las reglas de la sala.
            </p>
            <button 
              onClick={() => setIsPlaying(true)}
              className="bg-gradient-to-r from-[#D4AF37] to-[#F3D55B] hover:from-[#F3D55B] hover:to-[#FFF1A0] text-black font-bold py-4 px-12 rounded-xl transition-all shadow-[0_4px_15px_rgba(212,175,55,0.2)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.3)] text-lg"
            >
              INICIAR PARTIDA
            </button>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in duration-500 p-6">
            <ShieldAlert size={48} className="text-[#8A2BE2] mb-6 animate-pulse" />
            <h2 className="text-2xl font-bold text-white mb-4">Simulación de Permiso</h2>
            <p className="text-gray-400 max-w-lg mb-8 leading-relaxed">
              Aquí se montaría el Iframe o el Canvas del juego real. En el flujo del laboratorio, aquí saltará la alerta pidiendo el permiso de <strong>{gameInfo.permiso}</strong>.
            </p>
            <button 
              onClick={() => setIsPlaying(false)}
              className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
            >
              Detener juego
            </button>
          </div>
        )}
      </div>

    </div>
  );
}