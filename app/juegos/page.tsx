"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useCatalogoStore } from "@/lib/catalogoStore";
import { SALAS, salaDe } from "@/lib/salas";

export default function JuegosPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const rol = useAuthStore((s) => s.cuenta?.rol);

  // GET /juegos: el catálogo es del backend (nombre, descripción, requisito) y
  // el front solo aporta la parte visual de cada sala.
  const juegos = useCatalogoStore((s) => s.juegos);
  const cargando = useCatalogoStore((s) => s.cargando);
  const cargado = useCatalogoStore((s) => s.cargado);
  const cargar = useCatalogoStore((s) => s.cargar);

  useEffect(() => {
    if (user) void cargar();
  }, [user, cargar]);

  // Solo las salas que el frontend sabe pintar; el catálogo trae además los
  // juegos de laboratorio que no tienen sala propia.
  const salas = juegos.filter((juego) => juego.slug in SALAS);

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
      
      {/*
        Los tres roles del laboratorio, dichos donde importan.

        `participante`, `investigador` y `admin` son roles del estudio, no del
        negocio de casino, y esa diferencia solo se notaba al chocar contra un
        403. El backend impide que el personal juegue —sus partidas entrarían en
        la misma muestra que las de los participantes y ya no habría forma de
        separarlas— pero hasta ahora nada lo explicaba antes de intentarlo.
      */}
      {rol && rol !== "participante" && (
        <div className="mt-8 mb-2 rounded-xl border border-amber-500/30 bg-amber-950/30 px-5 py-4 text-sm text-amber-200 leading-relaxed">
          <strong className="block mb-1">Cuenta de {rol}: acceso de solo lectura al piso de juego</strong>
          Puedes recorrer las salas y consultar los datos del estudio, pero no apostar. Las partidas
          del personal de investigación y administración se mezclarían con las de los participantes,
          y los resultados dejarían de ser una muestra limpia. Para jugar, usa una cuenta de participante.
        </div>
      )}

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
      {cargando && !cargado ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-3xl border border-white/5 bg-[#0B0E14]">
          <RefreshCw size={28} className="text-[#8A2BE2] animate-spin mb-4" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Cargando catálogo…</p>
        </div>
      ) : salas.length === 0 ? (
        <div className="rounded-3xl border border-white/5 bg-[#0B0E14] p-12 text-center">
          <p className="text-sm text-gray-400">
            El catálogo del laboratorio está vacío. Corre <code className="text-[#D4AF37]">npm run db:seed</code> en el
            backend para sembrar las salas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {salas.map((game) => {
            const sala = salaDe(game.slug);
            return (
              <div
                key={game.id}
                onClick={() => handleGameAction(game.slug)}
                className="cursor-pointer group relative block rounded-3xl overflow-hidden bg-[#0B0E14] border border-white/5 hover:border-[#D4AF37]/50 transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] h-64 sm:h-72"
              >
                {/* Imagen de Fondo con Zoom */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${sala.imagenFondo})` }}
                ></div>

                {/* Degradado oscuro para que el texto resalte */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-[#05050A]/70 to-transparent pointer-events-none"></div>

                {/* Contenido de la Tarjeta */}
                <div className="absolute bottom-0 w-full p-6 sm:p-8 flex flex-col justify-end">
                  <h2 className="font-bold text-2xl text-white mb-2 group-hover:text-[#D4AF37] transition-colors">
                    {game.nombre}
                  </h2>

                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${sala.colorAcento} shadow-[0_0_8px_currentColor]`}></span>
                    <p className="font-medium text-xs text-gray-300 uppercase tracking-widest">{sala.requisito}</p>
                  </div>

                  <p className="mt-2 text-xs text-gray-400 leading-relaxed line-clamp-2">{game.descripcion}</p>

                  {/* Botón flotante oculto que aparece en hover */}
                  <div className="mt-4 overflow-hidden h-0 group-hover:h-10 transition-all duration-300 opacity-0 group-hover:opacity-100">
                    <span className="inline-block bg-[#3B2063] text-white text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg">
                      Entrar a la sala →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}