"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, ShieldAlert, Maximize2, Settings, Check } from "lucide-react";
import { useSesionRequerida } from "@/lib/useSesionRequerida";
import { useCatalogoStore } from "@/lib/catalogoStore";
import { usePartida } from "@/lib/usePartida";
import { pedirPermiso } from "@/lib/permisosLab";
import type { ResultadoDePermiso } from "@/lib/permisosLab";
import { salaDe } from "@/lib/salas";

/**
 * Sala genérica.
 *
 * Encadena el recorrido tal como lo espera el backend: el catálogo da el
 * `juego_id`, `POST /resultados` abre la partida, el permiso de la sala se
 * registra antes de abrir el diálogo del navegador y `POST /resultados/:id/completado`
 * la congela al salir.
 */
export default function GameRoom() {
  const params = useParams();
  const router = useRouter();
  const { user, resolviendo } = useSesionRequerida();
  const slug = params.slug as string;

  const cargarCatalogo = useCatalogoStore((s) => s.cargar);
  const catalogoCargado = useCatalogoStore((s) => s.cargado);
  const { juego, juegoId, resultado, iniciar, completar } = usePartida(slug);

  const [isPlaying, setIsPlaying] = useState(false);
  const [permisoPedido, setPermisoPedido] = useState<ResultadoDePermiso | null>(null);
  const sala = salaDe(slug);

  useEffect(() => {
    void cargarCatalogo();
  }, [cargarCatalogo]);

  // CADENERO: `desconocido` significa que GET /auth/yo sigue en vuelo, así que
  // no se expulsa a nadie hasta que el backend conteste.
  if (resolviendo || !user) return <div className="h-[calc(100vh-5rem)] bg-[#05050A]" />;

  const nombre = juego?.nombre ?? "Mesa privada";

  const entrarALaMesa = async () => {
    setIsPlaying(true);
    // Abre (o recupera) el resultado de esta sala en la sesión de laboratorio.
    await iniciar({ sala: slug });

    // El permiso de la sala se pide aquí: queda registrado que el sitio lo pidió
    // aunque la persona cierre el diálogo sin contestar.
    if (sala.permiso) {
      const respuesta = await pedirPermiso(sala.permiso, { juegoId });
      setPermisoPedido(respuesta);
    }
  };

  const salirDeLaMesa = async () => {
    // Congela el puntaje: `POST /resultados/:id/completado` es irreversible.
    await completar(resultado?.puntaje ?? 0, { sala: slug, salida: "manual" });
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-[1600px] mx-auto pb-6 px-4 sm:px-6">

      {/* Barra superior de la sala */}
      <div className="flex items-center justify-between mb-6 mt-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/juegos")}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#131722] border border-white/5 hover:bg-[#1E1133] hover:border-[#8A2BE2]/50 text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">{nombre}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full bg-current ${sala.colorTexto}`}></span>
              <p className="text-xs text-gray-400 uppercase tracking-widest">
                Requisito de sala: <span className="text-white font-medium">{sala.requisito}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-[#131722] border border-white/5 text-gray-400 hover:text-white transition-colors text-sm font-medium">
            <Settings size={16} /> Configuración
          </button>
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-[#131722] border border-white/5 text-gray-400 hover:text-white transition-colors text-sm font-medium">
            <Maximize2 size={16} /> Pantalla Completa
          </button>
        </div>
      </div>

      {/* Contenedor del Juego (Lienzo Central) */}
      <div className="flex-1 bg-[#05050A] border border-white/5 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col items-center justify-center">

        {/* Fondo decorativo del lienzo */}
        <div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{ backgroundImage: `url('${sala.imagenFondo}')` }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#05050A]/80 to-[#05050A] pointer-events-none"></div>

        {!isPlaying ? (
          <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 rounded-full bg-[#1E1133] border border-[#8A2BE2]/30 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(138,43,226,0.2)]">
              <Play size={40} className="text-[#D4AF37] ml-2" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 text-center">Mesa lista para jugar</h2>
            <p className="text-gray-400 text-sm mb-8 text-center max-w-md leading-relaxed px-4">
              {juego?.instrucciones_seguridad ??
                "Al iniciar la partida se aplicarán las reglas de la sala."}
            </p>
            <button
              onClick={() => void entrarALaMesa()}
              disabled={catalogoCargado && !juego}
              className="bg-gradient-to-r from-[#D4AF37] to-[#F3D55B] hover:from-[#F3D55B] hover:to-[#FFF1A0] text-black font-bold py-4 px-12 rounded-xl transition-all shadow-[0_4px_15px_rgba(212,175,55,0.2)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.3)] text-lg disabled:opacity-40"
            >
              INICIAR PARTIDA
            </button>
            {catalogoCargado && !juego && (
              <p className="mt-4 text-xs text-red-400">
                Esta sala no está en el catálogo del backend: siémbrala con <code>npm run db:seed</code>.
              </p>
            )}
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in duration-500 p-6 max-w-2xl">
            <ShieldAlert size={48} className="text-[#8A2BE2] mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">
              {juego?.tecnologia_demo ?? "Sala en curso"}
            </h2>
            <p className="text-gray-400 mb-6 leading-relaxed">{juego?.descripcion}</p>

            {resultado && (
              <p className="mb-6 flex items-center gap-2 text-xs uppercase tracking-widest text-green-400">
                <Check size={14} /> Partida registrada en tu sesión de laboratorio
              </p>
            )}

            {permisoPedido && (
              <div
                className={`mb-8 w-full rounded-xl border px-5 py-4 text-left text-sm ${
                  permisoPedido.ok
                    ? "border-[#45D0B5]/40 bg-[#45D0B5]/10 text-[#45D0B5]"
                    : "border-red-500/30 bg-red-500/10 text-red-300"
                }`}
              >
                {permisoPedido.detalle}
              </div>
            )}

            <button
              onClick={() => void salirDeLaMesa()}
              className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
            >
              Terminar partida
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
