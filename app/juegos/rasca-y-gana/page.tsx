"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Star, Maximize, Plus,
  ChevronDown, Info, Lock,
  Minus, Crown, Gem, Clover, Banknote,
  Coins, Landmark, Briefcase, X, Bell, Sparkle
} from "lucide-react";
import { useBalanceStore } from "@/lib/balanceStore";
import { useNotificationStore } from "@/lib/notificationStore";
import { useSalaDeJuego } from "@/lib/useSalaDeJuego";
import { useSesionRequerida } from "@/lib/useSesionRequerida";
import { pedirPermiso } from "@/lib/permisosLab";
import { registrarEvento } from "@/lib/eventos";

// --- CONFIGURACIÓN DE LOS BOLETOS ---
/**
 * Los boletos que sabe dibujar esta pantalla.
 *
 * `price` tiene que coincidir con el precio del motor del servidor, que es quien
 * cobra de verdad. `maxPrize` ya no es un numero suelto: se deriva del precio
 * con el multiplicador de la corona (20.000x), que es exactamente lo que puede
 * pagar el boleto. Antes se anunciaban topes que no correspondian a ninguna
 * tabla de premios, asi que la portada prometia cifras que el juego no podia dar.
 */
const MULTIPLICADOR_MAXIMO = 20_000;

const TICKETS = [
  { id: "rey", name: "Rey de Oro", price: 50, color: "text-yellow-500", border: "border-yellow-500/30", bg: "bg-yellow-900/20", icon: Crown, categories: ["Todos", "Mega Premios", "Nuevos"], popularity: 100 },
  { id: "diamante", name: "Diamante Azul", price: 20, color: "text-blue-500", border: "border-blue-500/30", bg: "bg-blue-900/20", icon: Gem, categories: ["Todos", "Diamante", "Clásicos"], popularity: 85 },
  { id: "fortuna", name: "Fortuna 7", price: 10, color: "text-green-500", border: "border-green-500/30", bg: "bg-green-900/20", icon: Clover, categories: ["Todos", "Clásicos"], popularity: 90 },
  { id: "mega", name: "Mega 777", price: 5, color: "text-red-500", border: "border-red-500/30", bg: "bg-red-900/20", icon: Banknote, categories: ["Todos", "Clásicos", "Mega Premios"], popularity: 75 },
  { id: "suerte", name: "Suerte Total", price: 2, color: "text-purple-500", border: "border-purple-500/30", bg: "bg-purple-900/20", icon: Star, categories: ["Todos", "Nuevos"], popularity: 60 },
].map((boleto) => ({ ...boleto, maxPrize: (boleto.price * MULTIPLICADOR_MAXIMO).toLocaleString("es-MX") }));

const CATEGORIES = ["Todos", "Clásicos", "Diamante", "Mega Premios", "Nuevos"];
const SORT_OPTIONS = [
  { id: "populares", label: "Más populares" },
  { id: "precio-asc", label: "Menor precio" },
  { id: "precio-desc", label: "Mayor precio" }
];

// --- SÍMBOLOS Y PREMIOS DEL JUEGO ---
/**
 * Los simbolos del carton, por el id que usa el servidor.
 *
 * `multiplicador` es lo que paga una tercia, en multiplos del precio del boleto,
 * y esta aqui solo para poder escribir la cifra debajo de cada casilla. La tabla
 * que manda es la del motor: si las dos se separan, lo que se cobra es la suya.
 */
const REWARD_SYMBOLS: Record<string, { icon: React.ElementType; name: string; multiplicador: number }> = {
  diamante: { icon: Gem, name: "Diamante", multiplicador: 1 },
  monedas: { icon: Coins, name: "Monedas", multiplicador: 2 },
  lingotes: { icon: Landmark, name: "Lingotes", multiplicador: 2 },
  campana: { icon: Bell, name: "Campana", multiplicador: 3 },
  trebol: { icon: Clover, name: "Trébol", multiplicador: 4 },
  anillo: { icon: Sparkle, name: "Anillo", multiplicador: 4 },
  cofre: { icon: Briefcase, name: "Cofre", multiplicador: 5 },
  fichas: { icon: Coins, name: "Fichas", multiplicador: 200 },
  corona: { icon: Crown, name: "Corona", multiplicador: 20_000 },
};

const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 });

export default function RascaYGanaPage() {
  const router = useRouter();
  const { user, resolviendo } = useSesionRequerida();
  const saldo = useBalanceStore((s) => s.saldo);
  const notificar = useNotificationStore((s) => s.notificar); // avisos flotantes + campana

  const [activeCategory, setActiveCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // Otra sala de acceso libre: sin permisos, pero acumula cookies y claves de
  // almacenamiento mientras se juega.
  const { juegoId, apostando, error: errorDeRonda, apostar, limpiarError, partida } =
    useSalaDeJuego("rasca-y-gana");
  const { iniciar, registrarProgreso } = partida;
  const capturaIniciada = useRef(false);

  /**
   * El guard se marca **después** de que `iniciar()` responda.
   *
   * Al revés, si el catálogo o la sesión todavía no estaban listos el inicio
   * devolvía `null`, el ref ya valía `true` y la captura no se reintentaba en
   * todo el montaje: la telemetría se perdía de forma intermitente.
   */
  useEffect(() => {
    if (!user || capturaIniciada.current) return;

    void (async () => {
      const resultado = await iniciar({ sala: "rasca-y-gana" });
      if (!resultado) return;

      capturaIniciada.current = true;

      const idDelJuego = resultado.juego_id ?? juegoId;
      await pedirPermiso("cookies", { juegoId: idDelJuego });
      await pedirPermiso("localStorage", { juegoId: idDelJuego });
    })();
  }, [user, iniciar, juegoId]);

  const [activeTicket, setActiveTicket] = useState(TICKETS[0]);
  const [quantity, setQuantity] = useState(1);
  const [gameState, setGameState] = useState<"idle" | "playing" | "revealed">("idle");
  const [prizes, setPrizes] = useState<string[]>([]);
  const [winAmount, setWinAmount] = useState(0);
  const [favorite, setFavorite] = useState(false);
  
  // Estado para controlar la pestaña flotante de Términos
  const [showTerms, setShowTerms] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const filteredTickets = useMemo(() => {
    const result = TICKETS.filter(t => t.categories.includes(activeCategory));
    if (sortBy.id === "populares") result.sort((a, b) => b.popularity - a.popularity);
    else if (sortBy.id === "precio-asc") result.sort((a, b) => a.price - b.price);
    else if (sortBy.id === "precio-desc") result.sort((a, b) => b.price - a.price);
    return result;
  }, [activeCategory, sortBy]);

  useEffect(() => {
    if (gameState === "idle" && filteredTickets.length > 0) {
      const isActiveVisible = filteredTickets.some(t => t.id === activeTicket.id);
      if (!isActiveVisible) setActiveTicket(filteredTickets[0]);
    }
  }, [activeCategory, filteredTickets, activeTicket.id, gameState]);

  useEffect(() => {
    const handleClickOutside = () => setIsSortMenuOpen(false);
    if (isSortMenuOpen) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isSortMenuOpen]);

  const drawCover = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#a3a3a3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? "#9ca3af" : "#d1d5db";
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 3, 3);
    }

    ctx.fillStyle = "#4b5563";
    ctx.font = "bold 30px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("RASCA AQUÍ", canvas.width / 2, canvas.height / 2);
  }, []);

  useEffect(() => {
    if (gameState === "idle") drawCover();
  }, [gameState, drawCover, activeTicket]);

  const handleScratch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== "playing" || !isDrawing.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 35, 0, Math.PI * 2);
    ctx.fill();

    checkRevealProgress();
  };

  const checkRevealProgress = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;

    for (let i = 3; i < pixels.length; i += 16) {
      if (pixels[i] < 128) transparentPixels++;
    }

    const totalPixelsChecked = pixels.length / 16;
    const percentCleared = (transparentPixels / totalPixelsChecked) * 100;

    if (percentCleared > 55) revealAll();
  };

  const revealAll = () => {
    setGameState("revealed");
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    canvas.style.transition = "opacity 0.5s ease-out";
    canvas.style.opacity = "0";
    
    setTimeout(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.transition = "none";
      canvas.style.opacity = "1";

      // El premio ya se acreditó cuando el servidor resolvió la ronda: rascar
      // solo descubre lo que había. Antes el saldo se sumaba aquí, así que el
      // dinero aparecía al terminar de rascar y no al comprar el boleto.
      if (winAmount > 0) {
        void registrarProgreso(Math.round(winAmount), { boleto: activeTicket.id, cantidad: quantity });

        // Aviso con la piel del casino (flotante + campana). Antes esto también
        // lanzaba un `new Notification()` del sistema operativo, que solo se veía
        // con el permiso de notificaciones ya concedido en otra sala: quien lo
        // negó no recibía nada, y quien lo concedió veía un globo gris del
        // navegador en mitad de un premio.
        notificar({
          titulo: "¡Premio Rasca y Gana!",
          mensaje: `¡Felicidades! Ganaste ${currency.format(winAmount)} en el boleto ${activeTicket.name}.`,
          tipo: "exito",
        });
      }
    }, 500);
  };

  /**
   * Comprar el boleto.
   *
   * El cartón se pide al servidor **antes** de dibujar la capa que se rasca, así
   * que las seis casillas que hay debajo son las que el motor sorteó y el premio
   * es el que ya se acreditó. La versión anterior decidía primero si el boleto
   * ganaba y luego rellenaba el cartón para que cuadrara: lo que se veía al
   * rascar era una consecuencia del premio y no su causa.
   */
  const playTicket = async () => {
    const totalCost = activeTicket.price * quantity;

    // `alert()` congelaba la sala entera hasta que alguien pulsara "Aceptar", con
    // el estilo del navegador y sin relación con la mesa. El aviso flotante dice
    // lo mismo sin bloquear y con el diseño del casino.
    if (saldo < totalCost) {
      notificar({
        titulo: "Saldo insuficiente",
        mensaje: `Este boleto cuesta ${currency.format(totalCost)} y tu saldo es de ${currency.format(saldo)}. Recarga en el cajero para seguir jugando.`,
        tipo: "aviso",
      });
      return;
    }

    limpiarError();

    const ronda = await apostar({ boleto: activeTicket.id, cantidad: quantity });
    if (!ronda) return;

    registrarEvento("compra_boleto", { boleto: activeTicket.id, cantidad: quantity, costo: totalCost }, juegoId);

    const desenlace = ronda.desenlace as { casillas: string[] } | null;

    setPrizes(desenlace?.casillas ?? []);
    setWinAmount(ronda.premio_mxn);
    setGameState("playing");
    drawCover();
  };

  const resetGame = () => {
    setGameState("idle");
    setWinAmount(0);
    setPrizes([]);
  };

  if (resolviendo || !user) return <div className="h-screen bg-[#05050A]" />;

  return (
    <div className="h-screen w-full flex flex-col bg-[#08080C] text-white font-sans overflow-hidden">
      
      {/* HEADER ESTILO CASINO */}
      <header className="h-16 shrink-0 border-b border-white/5 flex items-center justify-between px-4 lg:px-6 bg-[#0B0E14] relative z-20">
        <div className="flex items-center gap-4 w-1/3">
          <button onClick={() => router.push("/")} className="flex items-center justify-center w-8 h-8 rounded border border-white/10 hover:bg-white/5 transition-colors">
            <ChevronLeft size={20} className="text-[#D4AF37]" />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-widest uppercase">RASCA Y GANA</h1>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">Instant Win</p>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <Crown size={20} className="text-[#D4AF37] fill-[#D4AF37]/20 mb-0.5" />
          <h2 className="text-base font-serif font-bold text-[#D4AF37] leading-none tracking-widest drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">ROYAL</h2>
          <span className="text-[7px] font-sans tracking-[0.4em] text-[#D4AF37] mt-0.5">CASINO</span>
        </div>

        <div className="flex items-center justify-end gap-2 lg:gap-3 w-1/3">
          <div className="hidden lg:flex items-center bg-[#131722] rounded-lg px-3 py-1 border border-white/10 mr-2">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest mr-2">Saldo:</span>
            <span className="font-bold text-[#D4AF37] text-xs">{currency.format(saldo)}</span>
          </div>
          <button onClick={() => setFavorite(!favorite)} className="w-9 h-9 border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors">
            <Star size={14} fill={favorite ? "currentColor" : "none"} className={favorite ? "text-[#D4AF37]" : "text-gray-400"} />
          </button>
          <button onClick={() => {}} className="w-9 h-9 border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
            <Maximize size={14} />
          </button>
        </div>
      </header>

      {/* Errores de la compra: saldo insuficiente, sala cerrada, red caída. */}
      {errorDeRonda && (
        <div className="shrink-0 bg-red-950/40 border-b border-red-500/30 px-4 py-2 text-[11px] text-red-200 flex items-center justify-between gap-4">
          <span>{errorDeRonda}</span>
          <button onClick={limpiarError} className="text-red-300 hover:text-white font-bold uppercase tracking-widest">
            Cerrar
          </button>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 flex flex-col gap-4 min-h-0 overflow-hidden">
        
        {/* BANNER */}
        <section className="shrink-0 flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="hidden xl:flex flex-col justify-center max-w-sm">
            <h2 className="text-3xl font-bold mb-1 tracking-wide">Rasca y Gana</h2>
            <p className="text-gray-400 text-xs leading-relaxed">Rasca, gana y cobra al instante. ¡La suerte está en tus manos!</p>
          </div>
          
          <div className="flex-1 w-full bg-[#1A1100] bg-[url('/gana.png')] bg-cover bg-center bg-no-repeat border border-[#D4AF37]/40 rounded-2xl flex items-center shadow-[0_0_20px_rgba(212,175,55,0.15)] relative overflow-hidden min-h-[120px] md:min-h-[140px]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#05050A] via-[#05050A]/90 to-transparent"></div>
            <div className="relative z-10 p-6 md:p-8">
              <p className="text-[#D4AF37] font-black text-xs tracking-widest uppercase mb-1 drop-shadow-md flex items-center gap-1.5">
                <Crown size={14} /> PREMIOS AL INSTANTE
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-gray-200 text-sm">Hasta</p>
                <p className="text-transparent bg-clip-text bg-gradient-to-b from-[#FFF1A0] to-[#D4AF37] font-black text-3xl md:text-4xl drop-shadow-[0_2px_10px_rgba(212,175,55,0.6)]">
                  $1,000,000 MXN
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FILTROS */}
        <section className="shrink-0 flex justify-between items-center gap-4 border-b border-white/10 pb-3 relative z-30">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => { if(gameState === "idle") setActiveCategory(category) }}
                disabled={gameState !== "idle"}
                className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all ${
                  activeCategory === category 
                    ? "bg-[#2A1A4A] border border-[#8A2BE2] text-white shadow-[0_0_10px_rgba(138,43,226,0.3)]" 
                    : "bg-[#131722] border border-white/5 text-gray-400 hover:text-white disabled:opacity-50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsSortMenuOpen(!isSortMenuOpen); }}
              className="flex items-center gap-2 bg-[#131722] px-4 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
            >
              <span className="hidden sm:inline text-gray-500 text-[10px] uppercase tracking-widest">Ordenar:</span>
              <div className="flex items-center gap-1.5 text-white text-[10px] md:text-xs font-bold">
                {sortBy.label} <ChevronDown size={12} className={`transition-transform ${isSortMenuOpen ? "rotate-180" : ""}`} />
              </div>
            </button>
            
            {isSortMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#0B0E14] border border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-2">
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => { setSortBy(option); setIsSortMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${sortBy.id === option.id ? "text-[#D4AF37] bg-white/5" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CONTENEDOR CENTRAL: Sidebar + Juego */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 items-start relative z-10 min-h-0">
          
          {/* SIDEBAR BOLETOS */}
          <aside className="w-full lg:w-[280px] flex flex-col h-full shrink-0">
            <h3 className="text-[9px] font-bold tracking-widest text-gray-400 uppercase mb-3 pl-1 shrink-0">ELIGE TU BOLETO</h3>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0">
              {filteredTickets.length > 0 ? filteredTickets.map((ticket) => {
                const isActive = activeTicket.id === ticket.id;
                const Icon = ticket.icon;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => { if(gameState === "idle") setActiveTicket(ticket) }}
                    disabled={gameState !== "idle"}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isActive 
                        ? "bg-[#1A1A24] border-[#8A2BE2] shadow-[0_0_15px_rgba(138,43,226,0.15)]" 
                        : "bg-[#0B0E14] border-white/5 hover:border-white/20 disabled:opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${ticket.bg} ${ticket.border}`}>
                        <Icon className={ticket.color} size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-white truncate w-24">{ticket.name}</span>
                        <span className="text-[9px] text-gray-500 mt-0.5">Hasta <span className={ticket.color}>${ticket.maxPrize}</span></span>
                      </div>
                    </div>
                    <div className="bg-[#2A1A4A] border border-[#8A2BE2]/30 px-2 py-1 rounded-md text-white font-bold text-[10px]">
                      ${ticket.price}
                    </div>
                  </button>
                );
              }) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-xs">No hay boletos en esta categoría.</p>
                </div>
              )}
            </div>
          </aside>

          {/* ÁREA DE JUEGO CENTRAL */}
          <main className="flex-1 w-full h-full bg-[#0B0E14] border border-white/5 rounded-2xl p-4 lg:p-6 shadow-2xl flex flex-col min-h-0 gap-4">
            
            {/* EL CARTÓN */}
            <div className="flex-1 w-full max-w-[800px] mx-auto relative rounded-2xl border-2 border-white/10 p-2 shadow-2xl overflow-hidden bg-[#0a0a0a] min-h-0 flex flex-col items-center justify-center">
              
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(50,50,50,1)_0%,rgba(10,10,10,1)_100%)] pointer-events-none" />
              <div className="absolute inset-4 border border-[#D4AF37]/30 rounded-xl pointer-events-none" />
              
              <div className="relative w-full flex flex-col items-center z-10">
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <activeTicket.icon size={36} className={`${activeTicket.color} drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]`} />
                  <h3 className="text-3xl md:text-4xl font-serif font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-[#FFF1A0] via-[#D4AF37] to-[#8a551e] drop-shadow-md">
                    {activeTicket.name.toUpperCase()}
                  </h3>
                </div>

                <div className="relative w-[90%] max-w-[600px] h-[180px] sm:h-[220px] bg-[#e5e7eb] rounded-lg border-[4px] border-gray-300 shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] overflow-hidden shrink-0">
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-2 sm:gap-4 p-4">
                    {prizes.length > 0 ? prizes.map((casilla, idx) => {
                      // La casilla llega como id del servidor; el premio que se
                      // escribe debajo es el multiplicador por el precio del
                      // boleto, que es exactamente lo que pagaría una tercia.
                      const simbolo = REWARD_SYMBOLS[casilla] ?? REWARD_SYMBOLS.diamante;
                      const PrizeIcon = simbolo.icon;
                      const premio = simbolo.multiplicador * activeTicket.price * quantity;

                      return (
                        <div key={idx} className="flex flex-col items-center justify-center gap-1 sm:gap-2">
                          <PrizeIcon size={36} className="text-[#a37628] drop-shadow-md" />
                          <span className="text-black font-black text-sm sm:text-lg">{currency.format(premio)}</span>
                        </div>
                      );
                    }) : (
                      Array(6).fill(0).map((_, idx) => (
                        <div key={idx} className="flex flex-col items-center justify-center gap-1 sm:gap-2 opacity-10">
                          <activeTicket.icon size={36} className="text-black" />
                          <span className="text-black font-black text-sm sm:text-lg">???</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="absolute top-1/2 left-[5%] right-[5%] h-px bg-black/10 rounded-full" />
                  <div className="absolute left-1/3 top-[10%] bottom-[10%] w-px bg-black/10 rounded-full" />
                  <div className="absolute right-1/3 top-[10%] bottom-[10%] w-px bg-black/10 rounded-full" />

                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={220}
                    className={`absolute inset-0 w-full h-full object-fill cursor-crosshair touch-none ${gameState === "revealed" ? "pointer-events-none" : ""}`}
                    onMouseDown={(e) => { isDrawing.current = true; handleScratch(e); }}
                    onMouseUp={() => { isDrawing.current = false; }}
                    onMouseLeave={() => { isDrawing.current = false; }}
                    onMouseMove={handleScratch}
                    onTouchStart={(e) => { isDrawing.current = true; handleScratch(e); }}
                    onTouchEnd={() => { isDrawing.current = false; }}
                    onTouchMove={handleScratch}
                  />

                  {gameState === "revealed" && winAmount > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-500 z-10">
                      <div className="bg-gradient-to-b from-yellow-500 via-[#D4AF37] to-yellow-700 px-8 py-4 rounded-2xl border-[3px] border-white shadow-[0_0_40px_rgba(212,175,55,1)] text-black flex flex-col items-center animate-bounce">
                        <span className="text-[10px] font-black uppercase tracking-widest drop-shadow-sm">¡GANASTE!</span>
                        <span className="text-3xl font-black drop-shadow-md">{currency.format(winAmount)}</span>
                      </div>
                    </div>
                  )}
                  {gameState === "revealed" && winAmount === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-500 z-10">
                      <span className="text-white font-black text-xl tracking-widest bg-black/80 px-6 py-2 rounded-lg border border-white/20 shadow-2xl">NO HUBO SUERTE</span>
                    </div>
                  )}
                </div>

                <div className="w-full flex justify-between items-center absolute bottom-4 px-8 pointer-events-none">
                  <span className="text-[10px] text-gray-500 font-mono tracking-wider">N.º {Math.floor(Math.random() * 9000 + 1000)}-{Math.floor(Math.random() * 9000 + 1000)}</span>
                </div>
              </div>
            </div>

            {/* CONTROLES DE COMPRA */}
            <div className="shrink-0 bg-[#131722] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner">
              
              <div className="flex items-center gap-6 w-full md:w-auto px-2">
                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Precio</span>
                  <span className="text-xl font-bold text-white">${activeTicket.price} <span className="text-[10px] text-gray-500 font-normal">MXN</span></span>
                </div>

                <div className="w-px h-8 bg-white/10 hidden md:block"></div>

                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Cantidad</span>
                  <div className="flex items-center bg-[#0B0E14] border border-white/10 rounded-lg p-0.5">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={gameState !== "idle" || quantity <= 1} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/5 text-gray-400 disabled:opacity-50 transition-colors"><Minus size={14}/></button>
                    <span className="w-8 text-center font-bold text-white text-sm">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} disabled={gameState !== "idle" || quantity >= 10} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/5 text-gray-400 disabled:opacity-50 transition-colors"><Plus size={14}/></button>
                  </div>
                </div>

                <div className="w-px h-8 bg-white/10 hidden md:block"></div>

                <div className="flex flex-col">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total</span>
                  <span className="text-xl font-black text-[#D4AF37]">${activeTicket.price * quantity} <span className="text-[10px] text-gray-500 font-normal">MXN</span></span>
                </div>
              </div>

              <div className="flex flex-col w-full md:w-auto gap-1">
                {gameState === "idle" ? (
                  <button 
                    onClick={() => void playTicket()}
                    disabled={apostando || saldo < activeTicket.price * quantity}
                    className="w-full md:w-60 bg-gradient-to-b from-[#f4d477] to-[#d4af37] hover:from-[#FFF1A0] hover:to-[#e5c05c] text-black font-black py-3 rounded-xl shadow-[0_5px_15px_rgba(212,175,55,0.3)] transition-all tracking-widest text-sm disabled:opacity-50 disabled:grayscale active:scale-95"
                  >
                    JUGAR AHORA
                  </button>
                ) : gameState === "revealed" ? (
                  <button 
                    onClick={resetGame}
                    className="w-full md:w-60 bg-[#2A1A4A] border-2 border-[#8A2BE2] hover:bg-[#3B2063] text-white font-black py-3 rounded-xl transition-all tracking-widest text-sm shadow-[0_0_15px_rgba(138,43,226,0.3)] active:scale-95"
                  >
                    NUEVO BOLETO
                  </button>
                ) : (
                  <button 
                    disabled
                    className="w-full md:w-60 bg-gray-800 text-gray-400 font-black py-3 rounded-xl cursor-not-allowed tracking-widest text-sm border border-gray-700 animate-pulse"
                  >
                    RASCANDO...
                  </button>
                )}
                
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <div className="w-2.5 h-2.5 bg-green-500/20 rounded-sm flex items-center justify-center border border-green-500/50">
                    <div className="w-1 h-1 bg-green-500 rounded-sm"></div>
                  </div>
                  <span className="text-[9px] text-gray-400 font-medium">Disp: {Math.floor(Math.random() * 5000 + 10000).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </main>

      {/* FOOTER DE RESPONSABILIDAD */}
      <footer className="shrink-0 py-4 px-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 bg-black/50 relative z-20">
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <Lock size={12} className="text-gray-600" />
          <span>Juega con responsabilidad. +18 años.</span>
          <span className="hidden md:inline">|</span>
          <span>
            <button onClick={() => setShowTerms(true)} className="text-[#8A2BE2] hover:underline transition-colors focus:outline-none">
              Términos y Condiciones
            </button>
          </span>
        </div>
      </footer>

      {/* PESTAÑA FLOTANTE DE TÉRMINOS Y CONDICIONES (MODAL) */}
      {showTerms && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl w-full max-w-2xl flex flex-col max-h-[80vh] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-lg font-bold text-[#D4AF37] flex items-center gap-2">
                <Info size={18} /> Términos y Condiciones
              </h2>
              <button onClick={() => setShowTerms(false)} className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-gray-300 space-y-4 custom-scrollbar">
              <p><strong>1. Aceptación de los Términos</strong><br/>Al acceder y utilizar el juego &quot;Rasca y Gana&quot; de Royal Casino, el usuario acepta cumplir con estos términos y condiciones establecidos en nuestra plataforma digital.</p>
              <p><strong>2. Elegibilidad</strong><br/>El usuario debe tener al menos 18 años de edad y residir en una jurisdicción donde el juego en línea sea estrictamente legal. Es responsabilidad del jugador verificar las leyes de su localidad.</p>
              <p><strong>3. Compra de Boletos y Asignación de Premios</strong><br/>Las compras de los boletos digitales son definitivas y no reembolsables. Los premios se asignan de manera completamente aleatoria a través de nuestro generador de números aleatorios (RNG) certificado. El premio máximo y la tabla de pagos varían en función del boleto adquirido.</p>
              <p><strong>4. Juego Responsable</strong><br/>Royal Casino promueve en todo momento el juego responsable. Establece límites, no juegues dinero que no puedas permitirte perder, y si crees que tienes un problema con el juego, busca ayuda profesional inmediatamente.</p>
              <p><strong>5. Modificaciones</strong><br/>Royal Casino se reserva el estricto derecho de modificar, suspender o cancelar este juego en cualquier momento, con o sin previo aviso, por motivos de mantenimiento o seguridad.</p>
            </div>
            <div className="p-4 border-t border-white/10 flex justify-end">
              <button 
                onClick={() => setShowTerms(false)} 
                className="bg-[#D4AF37] hover:bg-[#F3D55B] text-black font-bold py-2.5 px-6 rounded-lg transition-colors shadow-lg"
              >
                Aceptar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}