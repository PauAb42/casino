"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Star, Maximize, Minimize, HelpCircle, 
  Plus, X, Layers, Edit2, 
  ChevronLeft, ChevronRight, MapPin, ShieldAlert
} from "lucide-react";
import { aCentavos, useBalanceStore } from "@/lib/balanceStore";
import { useNotificationStore } from "@/lib/notificationStore";
import { useSalaDeJuego } from "@/lib/useSalaDeJuego";
import { useSesionRequerida } from "@/lib/useSesionRequerida";
import { consultarEstadoDePermiso, pedirPermiso, registrarLecturaDeUbicacion } from "@/lib/permisosLab";

// --- TIPOS Y LÓGICA DEL BARAJA ---
type Suit = "♠" | "♥" | "♦" | "♣";
type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
  isHidden?: boolean;
}

const CHIP_VALUES = [100, 500, 1000, 2500, 5000, 10000];

/**
 * El palo que manda el servidor -> el simbolo que dibuja esta pantalla.
 *
 * La baraja, el reparto y el turno del crupier viven ahora en el motor del
 * backend. Que el cliente barajara sus propias cartas y simulara al crupier era
 * el agujero de esta sala: se podia repartir una mano ganadora o un crupier que
 * se pasara siempre, y no quedaba constancia de nada.
 */
const PALOS: Record<string, Suit> = {
  picas: "♠",
  corazones: "♥",
  diamantes: "♦",
  treboles: "♣",
};

interface CartaDelServidor {
  palo: string;
  rango: string;
  valor: number;
}

/** Convierte una carta de la API a la forma que ya sabia pintar la mesa. */
const aCartaVisible = (carta: CartaDelServidor): Card => ({
  suit: PALOS[carta.palo] ?? "♠",
  rank: carta.rango as Rank,
  value: carta.valor,
});

/**
 * Puntaje de una mano visible.
 *
 * Se conserva en el cliente **solo para pintar el marcador**: el puntaje que
 * decide quien gana lo calcula el servidor y llega en el desenlace. Tener las
 * dos versiones no es duplicar la regla, es que una es informativa y la otra
 * autoritativa.
 */
const calculateScore = (hand: Card[]): number => {
  let score = 0;
  let aces = 0;
  hand.forEach(card => {
    if (!card.isHidden) {
      score += card.value;
      if (card.rank === "A") aces += 1;
    }
  });
  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
};

export default function BlackjackVIP() {
  const router = useRouter();
  const { user, resolviendo } = useSesionRequerida();
  const saldo = useBalanceStore((s) => s.saldo);
  const { addNotification } = useNotificationStore();

  /**
   * La ubicación **no** bloquea la mesa.
   *
   * El aviso del sitio promete que rechazar no penaliza y que se puede seguir
   * jugando; esta sala hacía lo contrario y exigía geolocalización para repartir
   * una sola carta. Se sigue pidiendo —y el ejercicio de "una concesión, muchas
   * lecturas" sigue intacto— pero como banner, no como muro.
   */
  const [locationStatus, setLocationStatus] = useState<"prompt" | "granted" | "denied">("prompt");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [permisoUbicacionId, setPermisoUbicacionId] = useState<string | null>(null);
  const [lecturaDeUbicacion, setLecturaDeUbicacion] = useState<string | null>(null);
  const [avisoDePermiso, setAvisoDePermiso] = useState<string | null>(null);

  // La mano la reparte y resuelve el servidor.
  const { juegoId, apostando, error: errorDeRonda, apostar, accionar, limpiarError, partida } =
    useSalaDeJuego("blackjack-vip");
  const { iniciar, registrarProgreso } = partida;

  // Estados del Juego
  const [gameState, setGameState] = useState<"betting" | "playing" | "dealerTurn" | "gameOver">("betting");
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [currentBet, setCurrentBet] = useState(500);
  const [selectedChip, setSelectedChip] = useState(500);
  const [message, setMessage] = useState("");

  const formatMoney = (amount: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

  // --- 1. SOLICITUD DE UBICACIÓN ---
  // Pasa por el laboratorio: se registra que la mesa pidió el permiso, cómo
  // respondiste y cuánto tardaste, y cada lectura de posición se anota aparte.
  // El backend nunca guarda las coordenadas exactas: solo una celda de ~1.1 km
  // y el HMAC de la posición.
  const requestLocation = async () => {
    const resultado = await pedirPermiso("location", { juegoId });

    setLocationStatus(resultado.ok ? "granted" : "denied");
    setLecturaDeUbicacion(resultado.detalle);
    // El fallo de telemetría se informa aparte y no cuenta como denegación.
    setAvisoDePermiso(resultado.errorDeRegistro ?? null);

    if (resultado.permiso) setPermisoUbicacionId(resultado.permiso.id);
  };

  /**
   * Rehidratación: si el permiso ya estaba concedido, no se vuelve a pedir.
   *
   * Antes `locationStatus` arrancaba en `prompt` en cada montaje, así que
   * refrescar la página o volver a la sala exigía otra vez una autorización que
   * el navegador ya tenía dada.
   */
  useEffect(() => {
    if (!user) return;

    void (async () => {
      await iniciar({ sala: "blackjack-vip" });

      const estado = await consultarEstadoDePermiso("location");
      if (estado.navegador === "granted") {
        setLocationStatus("granted");
        setPermisoUbicacionId(estado.permisoId);
        setLecturaDeUbicacion("La mesa ya tenía tu ubicación concedida de antes.");
      }
    })();
  }, [user, iniciar]);

  /**
   * La demostración del ejercicio: una concesión, muchas lecturas.
   *
   * `watchPosition` puede releer la posición cuantas veces quiera sin volver a
   * preguntar, y el contador de lecturas frente al de diálogos es justo lo que
   * el informe enseña al final.
   */
  const volverALeerUbicacion = () => {
    if (!permisoUbicacionId) return;
    navigator.geolocation.getCurrentPosition(async (posicion) => {
      const lecturas = await registrarLecturaDeUbicacion(permisoUbicacionId, posicion);
      if (lecturas !== null) {
        setLecturaDeUbicacion(
          `La mesa volvió a leer tu ubicación sin preguntarte de nuevo. Van ${lecturas} lecturas con un solo permiso concedido.`,
        );
      }
    });
  };

  // --- ESCUCHADOR PANTALLA COMPLETA ---
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error al intentar pantalla completa: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // --- 2. LÓGICA DEL JUEGO ---
  //
  // Ninguna de estas funciones reparte una carta ni decide un ganador: piden un
  // paso al servidor y pintan lo que responde. `aplicarPaso` es el único sitio
  // donde el estado visible de la mesa se sincroniza con la ronda.

  /**
   * Vuelca una ronda del servidor sobre el estado de la mesa.
   *
   * Mientras la mano sigue abierta el backend **no manda** la segunda carta del
   * crupier, así que aquí se dibuja un reverso de relleno. Antes esa carta
   * viajaba al cliente y solo se "ocultaba" en la interfaz, que es enseñarla a
   * quien abra la pestaña de red.
   */
  const aplicarPaso = (nueva: NonNullable<Awaited<ReturnType<typeof apostar>>>) => {
    const desenlace = nueva.desenlace as {
      mano_jugador: CartaDelServidor[];
      mano_crupier: CartaDelServidor[];
      puntaje_jugador: number;
      puntaje_crupier?: number;
      resultado?: string;
      motivo?: string;
      apuesta_centavos: number;
    } | null;

    if (!desenlace) return;

    const manoJugador = desenlace.mano_jugador.map(aCartaVisible);
    const manoCrupier = desenlace.mano_crupier.map(aCartaVisible);

    setPlayerHand(manoJugador);
    setCurrentBet(Math.round(desenlace.apuesta_centavos / 100));

    if (nueva.estado === "abierta") {
      // Reverso de relleno: la carta real todavía no ha salido del servidor.
      setDealerHand([...manoCrupier, { suit: "♠", rank: "2", value: 0, isHidden: true }]);
      setGameState("playing");
      setMessage("");
      return;
    }

    setDealerHand(manoCrupier);
    setGameState("gameOver");

    void registrarProgreso(desenlace.puntaje_jugador, {
      motivo: desenlace.motivo ?? desenlace.resultado ?? "resuelta",
      puntaje_crupier: desenlace.puntaje_crupier ?? 0,
    });

    const premio = nueva.premio_mxn;

    switch (desenlace.resultado) {
      case "blackjack":
        setMessage("¡BLACKJACK!");
        addNotification(`¡Ganaste ${formatMoney(nueva.neto_mxn)} en Blackjack VIP!`);
        break;
      case "jugador":
        setMessage("¡Ganaste!");
        addNotification(`¡Ganaste ${formatMoney(nueva.neto_mxn)} en Blackjack VIP!`);
        break;
      case "empate":
        setMessage("Empate.");
        break;
      default:
        setMessage(desenlace.motivo === "pasado" ? "¡Te pasaste! Pierdes." : "El Crupier Gana.");
    }

    void premio;
  };

  const dealCards = async () => {
    if (saldo < currentBet) {
      alert("Saldo insuficiente para esta apuesta.");
      return;
    }

    limpiarError();
    setMessage("");

    const nueva = await apostar({ monto_centavos: aCentavos(currentBet) });
    if (nueva) aplicarPaso(nueva);
  };

  const hit = async () => {
    const nueva = await accionar("pedir");
    if (nueva) aplicarPaso(nueva);
  };

  const stand = async () => {
    setGameState("dealerTurn");
    const nueva = await accionar("plantarse");
    if (nueva) aplicarPaso(nueva);
    else setGameState("playing");
  };

  const doubleDown = async () => {
    // El servidor cobra la segunda mitad al doblar y rechaza si no alcanza.
    const nueva = await accionar("doblar");
    if (nueva) aplicarPaso(nueva);
  };

  const resetGame = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setGameState("betting");
    setMessage("");
    if (currentBet % 2 !== 0 || currentBet > saldo) setCurrentBet(500);
  };

  if (resolviendo || !user) return <div className="h-screen bg-[#05050A]" />;

  // INTERFAZ DEL JUEGO
  return (
    <div className="h-[calc(100vh-5rem)] bg-[#05050A] text-white flex flex-col font-sans selection:bg-[#8A2BE2]/30 overflow-hidden">

      {/*
        Petición de ubicación como banner, no como muro.

        Antes esto era una pantalla de bloqueo total: sin geolocalización no se
        repartía una sola carta. Contradecía el aviso del propio sitio ("rechazar
        no te penaliza: puedes seguir jugando igual") e impedía el acceso al
        producto por un permiso que la mesa no necesita para funcionar.
      */}
      {locationStatus !== "granted" && (
        <div className="shrink-0 flex flex-wrap items-center gap-3 border-b border-[#8A2BE2]/20 bg-[#1E1133]/40 px-6 py-2.5">
          <MapPin size={14} className="text-[#A78BFA] shrink-0" />
          <p className="flex-1 min-w-[220px] text-[11px] leading-relaxed text-gray-300">
            {locationStatus === "denied" ? (
              <>
                <ShieldAlert size={12} className="inline mr-1 text-red-400" />
                {lecturaDeUbicacion ?? "No se concedió la ubicación."} <strong className="text-gray-200">La mesa sigue abierta</strong>.
              </>
            ) : (
              <>
                Esta sala pide tu <strong className="text-gray-200">ubicación</strong> &quot;para validar tu región&quot;.
                No hace falta para jugar: puedes repartir igual.
              </>
            )}
          </p>
          {locationStatus === "prompt" && (
            <button
              onClick={() => void requestLocation()}
              className="rounded-lg border border-[#8A2BE2]/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#A78BFA] transition-colors hover:bg-[#8A2BE2]/20"
            >
              Permitir ubicación
            </button>
          )}
        </div>
      )}

      {/* El fallo de telemetría se informa; nunca cierra la mesa. */}
      {avisoDePermiso && (
        <div className="shrink-0 bg-amber-950/40 border-b border-amber-500/30 px-6 py-2 text-[11px] text-amber-200">
          El navegador respondió tu permiso, pero el laboratorio no pudo registrarlo: {avisoDePermiso}
        </div>
      )}

      {/* Errores de la apuesta: saldo insuficiente, mano ya abierta, red caída. */}
      {errorDeRonda && (
        <div className="shrink-0 bg-red-950/40 border-b border-red-500/30 px-6 py-2 text-[11px] text-red-200 flex items-center justify-between gap-4">
          <span>{errorDeRonda}</span>
          <button onClick={limpiarError} className="text-red-300 hover:text-white font-bold uppercase tracking-widest">
            Cerrar
          </button>
        </div>
      )}
      
      {/* Top Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-[#0B0E14] border-b border-white/5 shrink-0 z-20 relative">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push("/juegos")} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-medium text-gray-200">Blackjack VIP 1</h1>
            <Star size={16} className="text-gray-500 cursor-pointer hover:text-[#D4AF37] transition-colors" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 bg-[#131722] px-3 py-1.5 rounded-full border border-white/5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs text-gray-300 font-medium">En juego real</span>
          </div>
          
          {/* BOTÓN DE PANTALLA COMPLETA FUNCIONAL */}
          <button onClick={toggleFullScreen} className="text-gray-400 hover:text-white transition-colors" title={isFullscreen ? "Minimizar" : "Pantalla Completa"}>
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>

          <HelpCircle size={20} className="text-gray-400 cursor-pointer hover:text-white" />
        </div>
      </header>

      {/* Una concesión, muchas lecturas: la mesa puede releer tu posición sin
          volver a preguntar, y eso es justo lo que el informe final enseña. */}
      {permisoUbicacionId && (
        <div className="shrink-0 flex flex-wrap items-center gap-3 border-b border-[#8A2BE2]/20 bg-[#1E1133]/40 px-6 py-2.5">
          <MapPin size={14} className="text-[#A78BFA] shrink-0" />
          <p className="flex-1 min-w-[200px] text-[11px] leading-relaxed text-gray-300">
            {lecturaDeUbicacion ?? "La mesa tiene tu ubicación."}
          </p>
          <button
            onClick={volverALeerUbicacion}
            className="rounded-lg border border-[#8A2BE2]/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#A78BFA] transition-colors hover:bg-[#8A2BE2]/20"
          >
            Volver a leer sin preguntar
          </button>
        </div>
      )}

      {/* Game Area (La Mesa) */}
      <main className="flex-1 relative flex items-center justify-center p-4 lg:p-10 overflow-hidden">
        
        <div className="relative w-full max-w-6xl h-full min-h-[400px] bg-[radial-gradient(ellipse_at_center,_#1F2B4C,_#0A0F1F)] rounded-[4rem] sm:rounded-[6rem] border-[12px] border-[#181512] shadow-[0_0_80px_rgba(0,0,0,0.8)_inset] overflow-hidden flex flex-col items-center justify-between py-12">
          
          <div className="absolute inset-4 rounded-[3.5rem] sm:rounded-[5.5rem] border border-[#D4AF37]/20 pointer-events-none"></div>

          <div className="absolute top-4 w-64 h-12 bg-[#05050A]/80 border border-[#D4AF37]/30 rounded-lg flex items-center justify-center gap-1 px-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`w-6 h-6 rounded-full border-[2px] border-dashed border-white/50 ${['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-black'][i%5]}`}></div>
            ))}
          </div>

          <div className="absolute top-10 left-10 w-24 h-32 bg-[#05050A]/80 border border-[#D4AF37]/40 rounded-xl transform -rotate-12 shadow-2xl flex items-center justify-center hidden sm:flex">
            <div className="w-20 h-28 border border-[#D4AF37]/20 rounded-lg bg-[url('/pattern.png')] opacity-50"></div>
          </div>
          <div className="absolute top-10 right-10 w-24 h-32 bg-[#05050A]/80 border border-[#D4AF37]/40 rounded-xl transform rotate-12 shadow-2xl flex items-center justify-center hidden sm:flex">
            <div className="w-20 h-28 border border-[#D4AF37]/20 rounded-lg bg-[url('/pattern.png')] opacity-50"></div>
          </div>

          <div className="absolute left-8 top-1/2 -translate-y-1/2 bg-[#0B0E14]/80 backdrop-blur-sm border border-white/10 p-4 rounded-2xl w-40 hidden lg:block">
            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-4">Límites de Mesa</p>
            <div className="mb-4">
              <p className="text-xs text-gray-400">Mínimo</p>
              <p className="text-sm font-bold text-white">$100 MXN</p>
            </div>
            <div className="mb-6">
              <p className="text-xs text-gray-400">Máximo</p>
              <p className="text-sm font-bold text-white">$10,000 MXN</p>
            </div>
            <button className="w-full py-2 border border-white/10 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/5 transition-colors">
              DETALLES <HelpCircle size={12} className="inline ml-1 mb-0.5" />
            </button>
          </div>

          {gameState !== "betting" && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2 bg-[#0B0E14]/80 backdrop-blur-sm border border-white/10 p-4 rounded-2xl w-32 hidden lg:flex flex-col gap-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="text-xs text-gray-400">Dealer</span>
                <span className="text-sm font-bold text-white bg-white/10 px-2 py-0.5 rounded">{calculateScore(dealerHand.filter(c => !c.isHidden))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#D4AF37]">Tu mano</span>
                <span className="text-sm font-bold text-[#D4AF37] bg-[#D4AF37]/20 px-2 py-0.5 rounded">{calculateScore(playerHand)}</span>
              </div>
            </div>
          )}

          <div className="relative mt-8 sm:mt-12 flex flex-col items-center">
            <div className="flex justify-center -space-x-4 mb-2">
              {dealerHand.map((card, i) => (
                <div key={i} className={`w-20 h-28 sm:w-24 sm:h-36 bg-white rounded-xl shadow-xl flex items-center justify-center text-3xl sm:text-4xl border border-gray-200 transform transition-all hover:-translate-y-2 ${card.isHidden ? 'bg-[#1C1A3A] bg-[url("/pattern.png")] border-[#D4AF37]/40 text-transparent' : card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'}`}>
                  {!card.isHidden && (
                    <div className="flex flex-col items-center">
                      <span className="text-xl sm:text-2xl font-bold leading-none">{card.rank}</span>
                      <span>{card.suit}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {gameState !== "betting" && (
               <div className="bg-black/50 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm lg:hidden">
                 {calculateScore(dealerHand.filter(c => !c.isHidden))}
               </div>
            )}
          </div>

          <div className="text-center my-auto px-4 z-0">
            <h2 className="text-[#D4AF37] font-serif text-lg sm:text-3xl tracking-[0.2em] mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              BLACKJACK PAGA 3 A 2
            </h2>
            <p className="text-gray-400 font-serif italic text-xs sm:text-base tracking-wider mb-2">
              El dealer se planta en 17 y toma carta en 16
            </p>
            <p className="text-[#D4AF37] font-serif text-xs sm:text-lg tracking-[0.1em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] hidden sm:block">
              EL SEGURO PAGA 2 A 1
            </p>
            {gameState === "gameOver" && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm mt-12 z-50">
                <div className="bg-[#05050A]/90 backdrop-blur-md border border-[#D4AF37]/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(212,175,55,0.3)] animate-in zoom-in-95">
                  <h3 className="text-2xl sm:text-3xl font-black text-[#D4AF37] mb-2">{message}</h3>
                  <button onClick={resetGame} className="mt-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-2 rounded-full font-bold text-sm transition-colors">
                    Jugar de nuevo
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative mb-2 sm:mb-8 flex flex-col items-center z-10">
            {gameState !== "betting" ? (
              <>
                <div className="bg-black/50 text-[#D4AF37] border border-[#D4AF37]/30 text-sm font-bold px-4 py-1 rounded-full backdrop-blur-sm mb-4 lg:hidden">
                  {calculateScore(playerHand)}
                </div>
                <div className="flex justify-center -space-x-8">
                  {playerHand.map((card, i) => (
                    <div key={i} className={`w-24 h-36 sm:w-28 sm:h-40 bg-white rounded-xl shadow-2xl flex items-center justify-center text-4xl sm:text-5xl border border-gray-200 transform transition-all hover:-translate-y-4 ${card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'}`} style={{ zIndex: i }}>
                      <div className="absolute top-2 left-2 flex flex-col items-center">
                        <span className="text-xl font-bold leading-none">{card.rank}</span>
                        <span className="text-xl">{card.suit}</span>
                      </div>
                      <span>{card.suit}</span>
                      <div className="absolute bottom-2 right-2 flex flex-col items-center rotate-180">
                        <span className="text-xl font-bold leading-none">{card.rank}</span>
                        <span className="text-xl">{card.suit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 relative">
                <p className="text-white/30 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-center">Colocar<br/>Apuesta</p>
                {currentBet > 0 && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-16 h-16 rounded-full border-4 border-dashed border-white/80 bg-purple-900 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                      <span className="text-white font-bold text-sm">{currentBet}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-4 text-center">
              <p className="text-sm font-bold text-white">{formatMoney(currentBet)}</p>
            </div>
          </div>
          
        </div>

      </main>

      {/* Footer Controls */}
      <div className="bg-[#0B0E14] border-t border-white/5 pb-6 pt-4 px-4 shrink-0 relative z-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3 w-full md:w-auto">
            {gameState === "betting" ? (
              <button onClick={() => void dealCards()} disabled={currentBet === 0 || apostando} className="bg-gradient-to-r from-[#D4AF37] to-[#F3D55B] hover:from-[#F3D55B] hover:to-[#FFF1A0] text-black font-black py-3 sm:py-4 px-8 sm:px-10 rounded-xl uppercase tracking-widest text-xs sm:text-sm shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all disabled:opacity-50 disabled:grayscale">
                {apostando ? "Repartiendo…" : "Repartir"}
              </button>
            ) : gameState === "playing" ? (
              <>
                <button onClick={() => void hit()} className="bg-[#1B3B2B] hover:bg-[#25523B] border border-green-500/30 text-green-400 flex items-center gap-2 py-3 px-4 sm:px-6 rounded-xl font-bold uppercase tracking-wider text-[10px] sm:text-xs transition-colors">
                  <Plus size={16} /> Pedir
                </button>
                <button onClick={() => void stand()} className="bg-[#3B1B1B] hover:bg-[#522525] border border-red-500/30 text-red-400 flex items-center gap-2 py-3 px-4 sm:px-6 rounded-xl font-bold uppercase tracking-wider text-[10px] sm:text-xs transition-colors">
                  <X size={16} /> Plantarse
                </button>
                <button onClick={() => void doubleDown()} disabled={apostando || saldo < currentBet} className="bg-[#3A3018] hover:bg-[#524422] border border-[#D4AF37]/30 text-[#D4AF37] flex items-center gap-2 py-3 px-4 sm:px-6 rounded-xl font-bold uppercase tracking-wider text-[10px] sm:text-xs transition-colors disabled:opacity-50">
                  <span className="font-black">2x</span> Doblar
                </button>
                <button disabled className="bg-[#1C2333] border border-blue-500/20 text-blue-500/50 flex items-center gap-2 py-3 px-4 sm:px-6 rounded-xl font-bold uppercase tracking-wider text-[10px] sm:text-xs cursor-not-allowed">
                  <Layers size={16} /> Dividir
                </button>
              </>
            ) : null}
          </div>

          <div className={`flex items-center justify-center gap-1 sm:gap-2 transition-opacity ${gameState !== "betting" ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
            <button className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors"><ChevronLeft size={20}/></button>
            {CHIP_VALUES.map((val) => (
              <button 
                key={val} 
                onClick={() => { setSelectedChip(val); setCurrentBet(val); }}
                className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full border-4 border-dashed flex items-center justify-center font-bold text-[10px] sm:text-xs transition-all ${
                  selectedChip === val 
                    ? "border-purple-400 bg-purple-900 text-white scale-110 shadow-[0_0_15px_rgba(138,43,226,0.6)]" 
                    : "border-white/50 bg-[#131722] text-gray-300 hover:bg-[#1E1133] hover:border-white/80"
                }`}
              >
                {val >= 1000 ? `${val/1000}K` : val}
              </button>
            ))}
            <button className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors"><ChevronRight size={20}/></button>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4 bg-[#131722] border border-white/10 rounded-xl py-2 px-4 w-full md:w-auto">
            <div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Apuesta Total</p>
              <p className="text-sm font-bold text-white">{formatMoney(currentBet)}</p>
            </div>
            <button className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              <Edit2 size={14} />
            </button>
          </div>

        </div>

        <div className="max-w-6xl mx-auto mt-4 sm:mt-6 flex justify-between items-center text-[9px] sm:text-[10px] text-gray-600 font-mono uppercase tracking-widest border-t border-white/5 pt-3 sm:pt-4 hidden md:flex">
          <span>ID DE MANO: #BJVIP1-{Math.floor(Math.random() * 10000000)}</span>
          <span className="text-[#D4AF37]">SALDO: {formatMoney(saldo)}</span>
          <span>APUESTA TOTAL: {formatMoney(currentBet)}</span>
          <span>{new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} (CST)</span>
        </div>
      </div>

    </div>
  );
}