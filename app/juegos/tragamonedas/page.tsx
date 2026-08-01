"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Star,
  Maximize,
  User,
  Plus,
  Minus,
  Gem,
  ShieldCheck,
  Clover,
  Bell,
  Crown,
  Users,
  Send,
  Play
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useBalanceStore } from "@/lib/balanceStore";
import { useNotificationStore } from "@/lib/notificationStore"; // <-- Importación del Store de notificaciones

// --- SÍMBOLOS REALISTAS (Con gradientes y contornos) ---
const SYMBOLS = [
  { id: "7", type: "text", content: "7", color: "from-red-400 via-red-600 to-red-800", stroke: "#3a0000", multiplier: 50 },
  { id: "WILD", type: "wild", content: "WILD", color: "from-[#FCE38A] via-[#D4AF37] to-[#8B6508]", stroke: "#4a3200", multiplier: 100 },
  { id: "BAR", type: "bar", content: "BAR", color: "from-gray-200 via-gray-400 to-gray-500", stroke: "#111", multiplier: 30 },
  { id: "DIAMOND", type: "icon", content: Gem, color: "text-[#4dabf7] drop-shadow-[0_0_12px_rgba(77,171,247,0.8)]", multiplier: 20 },
  { id: "BELL", type: "icon", content: Bell, color: "text-[#fcc419] drop-shadow-[0_0_12px_rgba(252,196,25,0.8)]", multiplier: 15 },
  { id: "A", type: "letter", content: "A", color: "from-yellow-200 via-yellow-500 to-yellow-700", stroke: "#402000", multiplier: 10 },
  { id: "K", type: "letter", content: "K", color: "from-green-300 via-green-500 to-green-800", stroke: "#003300", multiplier: 5 },
];

const SPIN_DURATION_MS = 2000;
const TICK_RATE_MS = 60; // Más rápido para mejor fluidez visual

const INITIAL_REELS = [
  [SYMBOLS[0], SYMBOLS[3], SYMBOLS[5]],
  [SYMBOLS[4], SYMBOLS[1], SYMBOLS[2]],
  [SYMBOLS[2], SYMBOLS[6], SYMBOLS[0]],
  [SYMBOLS[3], SYMBOLS[5], SYMBOLS[4]],
  [SYMBOLS[4], SYMBOLS[2], SYMBOLS[3]],
];

const RECENT_SPINS = [
  { val: "7", color: "text-red-500" },
  { val: "34", color: "text-red-500" },
  { val: "2", color: "text-white" },
  { val: "17", color: "text-red-500" },
  { val: "0", color: "text-green-500" },
  { val: "25", color: "text-red-500" },
  { val: "19", color: "text-red-500" },
  { val: "6", color: "text-white" },
  { val: "13", color: "text-red-500" },
  { val: "30", color: "text-red-500" },
];

const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 });

export default function TragamonedasPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance, setBalance } = useBalanceStore();
  const { addNotification } = useNotificationStore(); // <-- Hook de notificaciones

  const [lines, setLines] = useState(25);
  const [betPerLine, setBetPerLine] = useState(4);
  const totalBet = lines * betPerLine;

  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState(INITIAL_REELS);
  const [lastWin, setLastWin] = useState<number>(0);
  const [totalWagered, setTotalWagered] = useState(2350);
  const [roundsPlayed, setRoundsPlayed] = useState(28);
  const [highestWin, setHighestWin] = useState(1250);
  const [statusMessage, setStatusMessage] = useState("¡BUENA SUERTE!");
  const [favorite, setFavorite] = useState(false);
  
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: "LuckySpin", text: "Veamos qué tal paga esta ronda.", isDealer: false },
    { id: 2, user: "Soporte", text: "Bienvenidos a Royal Slots.", isDealer: true },
  ]);
  const chatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    const SIMULATED_CHAT_MESSAGES = [
      { user: "TragaMax", text: "La volatilidad de esta máquina es buena." },
      { user: "LuckySpin", text: "Esperando la línea de diamantes." },
      { user: "VIP_Royal", text: "Subiendo la apuesta." },
      { user: "Soporte", text: "Recuerden jugar de forma responsable.", isDealer: true },
    ];

    const scheduleMessage = () => {
      const delay = 8000 + Math.floor(Math.random() * 10000);
      return window.setTimeout(() => {
        const message = SIMULATED_CHAT_MESSAGES[Math.floor(Math.random() * SIMULATED_CHAT_MESSAGES.length)];
        setChatMessages((prev) => [...prev.slice(-30), { id: Date.now(), user: message.user, text: message.text, isDealer: Boolean(message.isDealer) }]);
        chatTimerRef.current = scheduleMessage();
      }, delay);
    };
    chatTimerRef.current = scheduleMessage();
    return () => { if (chatTimerRef.current) clearTimeout(chatTimerRef.current); };
  }, [user]);

  const adjustBetPerLine = (amount: number) => {
    if (!spinning) {
      const newBet = betPerLine + amount;
      if (newBet >= 0.50 && newBet <= 50) setBetPerLine(newBet);
    }
  };

  const adjustLines = (amount: number) => {
    if (!spinning) {
      const newLines = lines + amount;
      if (newLines >= 5 && newLines <= 25) setLines(newLines);
    }
  };

  const setMaxBet = () => {
    if (!spinning) {
      setLines(25);
      setBetPerLine(50);
    }
  };

  const getRandomSymbol = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

  const spin = () => {
    if (spinning) return;
    if (balance < totalBet) {
      setStatusMessage("SALDO INSUFICIENTE");
      return;
    }

    setBalance((prev) => prev - totalBet);
    setTotalWagered((prev) => prev + totalBet);
    setRoundsPlayed((prev) => prev + 1);
    
    setSpinning(true);
    setLastWin(0);
    setStatusMessage("GIRANDO...");

    spinIntervalRef.current = setInterval(() => {
      setReels([
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      ]);
    }, TICK_RATE_MS);

    stopTimeoutRef.current = setTimeout(() => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);

      const finalReels = [
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      ];
      setReels(finalReels);

      const isWin = Math.random() > 0.6; 
      let winAmount = 0;

      if (isWin) {
        const randomMult = Math.floor(Math.random() * 10) + 2;
        winAmount = totalBet * randomMult;
        setBalance((prev) => prev + winAmount);
        setLastWin(winAmount);
        if (winAmount > highestWin) setHighestWin(winAmount);
        setStatusMessage(`¡GANASTE ${currency.format(winAmount)}!`);

        // <-- Lógica Global de Notificaciones -->
        addNotification(`¡Felicidades! Ganaste ${currency.format(winAmount)} en las Tragamonedas.`);

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("¡Premio en Tragamonedas!", {
            body: `¡Felicidades! Has ganado ${currency.format(winAmount)} en Royal Slots.`,
            icon: "/tragamonedas.png",
          });
        }
      } else {
        setStatusMessage("¡BUENA SUERTE!");
      }

      setSpinning(false);
    }, SPIN_DURATION_MS);
  };

  const sendChatMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages((prev) => [...prev, { id: Date.now(), user: user?.participante?.alias || "Jugador", text, isDealer: false }]);
    setChatInput("");
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch { setStatusMessage("No se pudo activar pantalla completa."); }
  };

  if (!user) return <div className="h-screen bg-[#05050A]"></div>;

  // Renderizador de Símbolos Mejorado (Efecto físico y metálico)
  const RenderSymbol = ({ sym, isBlur }: { sym: typeof SYMBOLS[0], isBlur: boolean }) => {
    // Blur direccional (alargado) para simular alta velocidad mecánica
    const motionClass = isBlur ? "blur-[2px] scale-y-[1.8] opacity-70" : "blur-0 scale-y-100 opacity-100 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]";
    
    if (sym.type === "text" || sym.type === "letter") {
      return (
        <span 
          className={`text-6xl sm:text-7xl font-black transition-all duration-75 font-serif bg-clip-text text-transparent bg-gradient-to-b ${sym.color} ${motionClass}`}
          style={{ WebkitTextStroke: `2px ${sym.stroke}` }}
        >
          {sym.content as string}
        </span>
      );
    }
    
    if (sym.type === "bar") {
      return (
        <div className={`flex flex-col items-center justify-center transition-all duration-75 ${motionClass}`}>
          <div className="border-[3px] border-gray-400 bg-gradient-to-b from-gray-900 via-black to-gray-900 px-3 py-2 rounded-full shadow-[inset_0_0_10px_rgba(255,255,255,0.2),0_5px_10px_rgba(0,0,0,0.8)]">
            <span 
              className={`text-2xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-b ${sym.color}`}
            >
              {sym.content as string}
            </span>
          </div>
        </div>
      );
    }

    if (sym.type === "wild") {
      return (
        <div className={`flex flex-col items-center justify-center relative transition-all duration-75 ${motionClass}`}>
          <Crown size={60} className="text-[#D4AF37] fill-[#D4AF37]/30 filter drop-shadow-[0_2px_5px_rgba(0,0,0,1)]" strokeWidth={1.5} />
          <span 
            className="text-2xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 absolute bottom-0"
            style={{ WebkitTextStroke: '1px #402000' }}
          >
            WILD
          </span>
        </div>
      );
    }
    
    const Icon = sym.content as React.ElementType;
    return (
      <div className={`relative transition-all duration-75 flex items-center justify-center ${motionClass}`}>
        {/* Sombra base profunda para separar del rodillo */}
        <Icon className={`absolute w-16 h-16 sm:w-20 sm:h-20 text-black mt-2`} strokeWidth={2.5} />
        {/* Icono brillante principal */}
        <Icon className={`relative w-16 h-16 sm:w-20 sm:h-20 ${sym.color}`} strokeWidth={1.5} />
      </div>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#08080C] text-white font-sans overflow-hidden select-none">
      
      {/* HEADER EXACTAMENTE ESTILO RULETA */}
      <header className="h-16 shrink-0 border-b border-white/5 flex items-center justify-between px-4 lg:px-6 bg-[#0B0E14] relative z-20">
        <div className="flex items-center gap-4 w-1/3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Tragamonedas</h1>
          </div>
        </div>

        <div className="hidden sm:flex w-1/3 flex-col items-center justify-center">
          <Crown size={20} className="text-[#D4AF37] fill-[#D4AF37]/20 mb-0.5" />
          <h2 className="text-base font-serif font-bold text-[#D4AF37] leading-none tracking-widest drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">ROYAL</h2>
          <span className="text-[7px] font-sans tracking-[0.4em] text-[#D4AF37] mt-0.5">CASINO</span>
        </div>

        <div className="flex items-center justify-end gap-2 lg:gap-3 w-1/3">
          <button
            type="button"
            onClick={() => router.push("/juegos")}
            className="hidden sm:flex items-center gap-2 border border-white/10 rounded-lg px-4 py-2 text-xs font-medium hover:bg-white/5 transition-colors"
          >
            MÁS JUEGOS <Plus size={15} />
          </button>
          <button
            type="button"
            onClick={() => setFavorite((previous) => !previous)}
            className="w-9 h-9 border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <Star size={16} className={favorite ? "text-[#D4AF37]" : "text-gray-400"} fill={favorite ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-9 h-9 border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
          >
            <Maximize size={16} />
          </button>
        </div>
      </header>

      {/* CUERPO CENTRAL */}
      <div className="flex-1 flex flex-row px-4 py-4 gap-4 min-h-0 relative">
        
        {/* PANEL IZQUIERDO: Info y Stats */}
        <aside className="hidden lg:flex w-[220px] flex-col gap-3 shrink-0 h-full">
          <div className="bg-gradient-to-b from-[#131722] to-[#0B0E14] border border-white/10 rounded-xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border border-[#D4AF37]/50 flex items-center justify-center bg-black shadow-[0_0_10px_rgba(212,175,55,0.3)]">
              <User size={20} className="text-[#D4AF37]" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">{user.participante?.alias || "Jugador"}</p>
              <p className="text-[9px] text-gray-500 mb-1">ID: 2354887</p>
              <span className="bg-purple-900 border border-purple-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-[0_0_8px_rgba(147,51,234,0.5)]">VIP</span>
            </div>
          </div>

          <div className="bg-[#0B0E14] border border-white/10 rounded-xl p-4 flex flex-col justify-center gap-1 shadow-lg">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Saldo</p>
            <div className="flex items-center justify-between">
              <p className="font-black text-xl text-[#D4AF37] drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">{currency.format(balance)}</p>
              <button onClick={() => router.push("/cajero")} className="w-6 h-6 border border-[#D4AF37] text-[#D4AF37] rounded flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition-colors">
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="bg-[#0B0E14] border border-white/10 rounded-xl p-4 flex flex-col justify-center gap-1 shadow-lg">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Apuesta Total</p>
            <p className="font-black text-lg text-white">{currency.format(totalBet)}</p>
          </div>

          <div className="bg-[#0B0E14] border border-white/10 rounded-xl p-4 flex flex-col justify-center gap-1 shadow-lg">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Última Ganancia</p>
            <p className={`font-black text-lg ${lastWin > 0 ? "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "text-gray-500"}`}>{currency.format(lastWin)}</p>
          </div>

          <div className="bg-[#0B0E14] border border-white/10 rounded-xl p-4 flex-1 flex flex-col justify-center gap-3 shadow-lg">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 uppercase tracking-wider text-[9px]">Rondas Jugadas</span>
              <span className="font-bold text-[#D4AF37]">{roundsPlayed}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-white/5 pt-3">
              <span className="text-gray-500 uppercase tracking-wider text-[9px]">Total Apostado</span>
              <span className="font-bold text-[#D4AF37]">{currency.format(totalWagered)}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-white/5 pt-3">
              <span className="text-gray-500 uppercase tracking-wider text-[9px]">Mayor Premio</span>
              <span className="font-bold text-[#D4AF37]">{currency.format(highestWin)}</span>
            </div>
          </div>
        </aside>

        {/* CENTRO: La Máquina */}
        <main className="flex-1 flex flex-col items-center justify-center relative bg-[radial-gradient(ellipse_at_center,rgba(20,15,30,1)_0%,rgba(5,5,10,1)_100%)] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
          
          {/* Barra de Jackpots Superior */}
          <div className="absolute top-4 w-[90%] max-w-[800px] grid grid-cols-4 gap-2 z-20">
            <div className="bg-gradient-to-b from-black/80 to-black border-t-2 border-red-900 rounded-lg p-2 flex flex-col items-center shadow-[0_5px_15px_rgba(220,38,38,0.15)]">
              <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Grand</span>
              <span className="text-red-500 font-black text-sm drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">$ 125,000.00</span>
            </div>
            <div className="bg-gradient-to-b from-black/80 to-black border-t-2 border-purple-900 rounded-lg p-2 flex flex-col items-center shadow-[0_5px_15px_rgba(147,51,234,0.15)]">
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Major</span>
              <span className="text-purple-400 font-black text-sm drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">$ 25,000.00</span>
            </div>
            <div className="bg-gradient-to-b from-[#1a1500] to-black border-2 border-yellow-500 rounded-lg p-2 flex flex-col items-center scale-110 shadow-[0_10px_25px_rgba(234,179,8,0.3)] z-10">
              <span className="text-[10px] text-yellow-400 font-black uppercase tracking-widest">Mega Win</span>
              <span className="text-yellow-400 font-black text-base drop-shadow-[0_0_8px_rgba(250,204,21,1)]">$ 15,428.75</span>
            </div>
            <div className="bg-gradient-to-b from-black/80 to-black border-t-2 border-blue-900 rounded-lg p-2 flex flex-col items-center shadow-[0_5px_15px_rgba(59,130,246,0.15)]">
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Minor</span>
              <span className="text-blue-400 font-black text-sm drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]">$ 5,000.00</span>
            </div>
          </div>

          {/* MARCO DORADO DE LA MÁQUINA (Más pesado y realista) */}
          <div className="w-full max-w-[850px] aspect-[16/9] mt-8 relative p-4 bg-gradient-to-br from-[#ffd700] via-[#b8860b] to-[#553a00] rounded-2xl shadow-[0_25px_50px_rgba(0,0,0,0.8),inset_0_2px_5px_rgba(255,255,255,0.5)] border-[6px] border-[#221100]">
            
            {/* Fondo interno de los rodillos con curvatura simulada */}
            <div className="w-full h-full bg-[#050505] rounded-xl relative flex overflow-hidden border-4 border-[#111] shadow-[inset_0_40px_50px_-15px_rgba(0,0,0,1),inset_0_-40px_50px_-15px_rgba(0,0,0,1)]">
              
              {/* Capa de Cristal/Brillo superior */}
              <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-b from-white/10 via-transparent to-black/60 mix-blend-overlay" />
              
              {/* Indicadores laterales de "25 LÍNEAS" */}
              <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-40 bg-black/50 p-1 rounded-full border border-white/10">
                <span className="text-[#D4AF37] font-black text-lg drop-shadow-[0_0_5px_rgba(212,175,55,1)]">25</span>
              </div>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-40 bg-black/50 p-1 rounded-full border border-white/10">
                <span className="text-[#D4AF37] font-black text-lg drop-shadow-[0_0_5px_rgba(212,175,55,1)]">25</span>
              </div>

              {/* GRID DE RODILLOS (5 columnas x 3 filas) */}
              <div className="w-full h-full grid grid-cols-5 px-8 relative z-20 gap-1 bg-[#1a1a1a]">
                {[0, 1, 2, 3, 4].map((colIndex) => (
                  <div 
                    key={`col-${colIndex}`} 
                    className="flex flex-col bg-gradient-to-b from-[#0a0a0c] via-[#1c1c20] to-[#0a0a0c] border-x border-[#333] shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]"
                  >
                    {[0, 1, 2].map((rowIndex) => {
                      const symbol = reels[colIndex][rowIndex];
                      const isWinningLine = lastWin > 0 && !spinning; 
                      
                      return (
                        <div key={`cell-${colIndex}-${rowIndex}`} className="flex-1 flex items-center justify-center relative">
                          {/* Divisor físico sutil entre filas */}
                          {rowIndex > 0 && <div className="absolute top-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#444] to-transparent opacity-30" />}
                          
                          <div className={`transition-all duration-300 w-full h-full flex items-center justify-center ${isWinningLine && rowIndex === 1 ? "scale-110 z-10 bg-white/5 rounded-lg border border-yellow-500/30 shadow-[0_0_30px_rgba(212,175,55,0.4)]" : "scale-100"}`}>
                            <RenderSymbol sym={symbol} isBlur={spinning} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* BARRA DE MENSAJE INFERIOR (Pantalla LED) */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#050505] border-4 border-[#332200] px-16 py-2 rounded-lg shadow-[0_10px_20px_rgba(0,0,0,0.8),inset_0_0_15px_rgba(0,0,0,0.8)] z-40 min-w-[320px] text-center">
              <p className={`font-black text-lg tracking-widest uppercase ${lastWin > 0 && !spinning ? "text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-pulse" : "text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"}`}>
                {statusMessage}
              </p>
            </div>
          </div>
        </main>

        {/* PANEL DERECHO: Últimos Giros y Chat */}
        <aside className="hidden lg:flex w-[260px] flex-col shrink-0 h-full gap-4">
          <div className="bg-[#0B0E14] border border-white/5 rounded-xl overflow-hidden shadow-lg">
            <div className="p-3 border-b border-white/5 flex justify-center items-center bg-[#131722]">
              <h3 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Últimos Giros</h3>
            </div>
            <div className="flex flex-wrap justify-center py-4 gap-3 px-2 h-32 overflow-y-auto custom-scrollbar">
              {RECENT_SPINS.map((spin, i) => (
                <span key={i} className={`text-xl font-bold font-serif w-1/3 text-center ${spin.color}`}>
                  {spin.val}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-[#0B0E14] border border-white/5 rounded-xl overflow-hidden shadow-lg flex flex-col min-h-0">
            <div className="p-3 border-b border-white/5 flex justify-between items-center bg-[#131722]">
              <h3 className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">Sala de Chat</h3>
              <Users size={14} className="text-gray-500" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs custom-scrollbar">
              {chatMessages.map((message) => (
                <div key={message.id} className="leading-relaxed">
                  <span className={`font-bold mr-2 ${message.isDealer ? "text-[#D4AF37]" : "text-gray-400"}`}>{message.user}:</span>
                  <span className="text-gray-300">{message.text}</span>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/5 bg-[#131722]">
              <div className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendChatMessage(); }}
                  placeholder="Escribir..."
                  className="w-full bg-[#0B0E14] border border-white/10 rounded py-2 pl-3 pr-8 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                />
                <button onClick={sendChatMessage} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </aside>

      </div>

      {/* FOOTER CONTROLES */}
      <footer className="h-24 shrink-0 bg-gradient-to-t from-[#05050A] to-[#0B0E14] border-t-2 border-[#1E1133] flex items-center justify-between px-6 relative z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        
        <div className="flex items-center gap-4 w-1/4"></div>

        <div className="flex-1 flex justify-center gap-4 lg:gap-8 bg-black/30 p-2 rounded-2xl border border-white/5 shadow-inner">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Líneas</span>
            <div className="flex items-center gap-3 bg-gradient-to-b from-[#1a1a24] to-[#131722] border border-white/10 rounded-full px-1 py-1 shadow-lg">
              <button onClick={() => adjustLines(-5)} disabled={spinning || lines <= 5} className="w-8 h-8 rounded-full bg-black flex items-center justify-center hover:text-[#D4AF37] disabled:opacity-50 transition-colors shadow-inner"><Minus size={14}/></button>
              <span className="w-8 text-center font-bold text-white text-lg">{lines}</span>
              <button onClick={() => adjustLines(5)} disabled={spinning || lines >= 25} className="w-8 h-8 rounded-full bg-black flex items-center justify-center hover:text-[#D4AF37] disabled:opacity-50 transition-colors shadow-inner"><Plus size={14}/></button>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Apuesta</span>
            <div className="flex items-center gap-3 bg-gradient-to-b from-[#1a1a24] to-[#131722] border border-white/10 rounded-full px-1 py-1 shadow-lg">
              <button onClick={() => adjustBetPerLine(-1)} disabled={spinning || betPerLine <= 0.5} className="w-8 h-8 rounded-full bg-black flex items-center justify-center hover:text-[#D4AF37] disabled:opacity-50 transition-colors shadow-inner"><Minus size={14}/></button>
              <span className="w-16 text-center font-bold text-white text-lg">${betPerLine.toFixed(2)}</span>
              <button onClick={() => adjustBetPerLine(1)} disabled={spinning || betPerLine >= 50} className="w-8 h-8 rounded-full bg-black flex items-center justify-center hover:text-[#D4AF37] disabled:opacity-50 transition-colors shadow-inner"><Plus size={14}/></button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center px-6 border-l border-r border-white/10">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Apuesta Total</span>
            <span className="font-black text-[#D4AF37] text-2xl tracking-wide drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]">{currency.format(totalBet)}</span>
          </div>

          <button onClick={setMaxBet} disabled={spinning} className="bg-gradient-to-b from-[#2a1a4a] to-[#1E1133] border border-[#8A2BE2] hover:from-[#3a2a6a] hover:to-[#2a1a4a] text-[#c492ff] disabled:opacity-50 rounded-xl px-5 py-2 flex flex-col items-center justify-center transition-colors shadow-[0_5px_15px_rgba(138,43,226,0.3)]">
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none drop-shadow-md">Apuesta</span>
            <span className="text-sm font-black uppercase tracking-widest leading-none mt-1 drop-shadow-md">Máx.</span>
          </button>
        </div>

        <div className="w-1/4 flex flex-col items-end justify-center pr-4">
          <button 
            type="button" 
            onClick={spin} 
            disabled={spinning || balance < totalBet} 
            className="bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 disabled:from-gray-700 disabled:to-gray-900 border border-green-400 disabled:border-gray-600 text-white flex items-center justify-center gap-2 px-6 lg:px-10 py-4 rounded-xl font-black text-lg transition-all shadow-[0_10px_25px_rgba(21,128,61,0.5),inset_0_2px_5px_rgba(255,255,255,0.3)] disabled:shadow-none w-48 active:scale-95"
          >
            <Play size={20} className={spinning ? "animate-pulse" : "drop-shadow-md"} fill={spinning ? "none" : "currentColor"} /> 
            {spinning ? "GIRANDO..." : "GIRAR"}
          </button>
        </div>
      </footer>

      {/* FOOTER EXTRA DE INFORMACIÓN */}
      <div className="h-10 shrink-0 bg-[#050505] flex items-center justify-center gap-12 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Gem size={14} className="text-[#D4AF37]" />
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Pagos Altos</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#D4AF37]" />
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Juego Justo</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clover size={14} className="text-[#D4AF37]" />
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Tu Suerte</span>
          </div>
        </div>
      </div>

    </div>
  );
}