"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Video, Mic, ShieldAlert, Star, Trophy, Users, 
  Clock, Send, Smile, ChevronLeft, ChevronRight, 
  Maximize, Minimize, HelpCircle, Radio, Play, CheckCircle2
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useBalanceStore } from "@/lib/balanceStore";
import { useNotificationStore } from "@/lib/notificationStore";

const CHIP_VALUES = [100, 500, 1000, 2500, 5000, 10000];

const OTHER_TABLES = [
  { id: 1, nombre: "Blackjack en Vivo", tipo: "VIP 2", limites: "$100 - $10,000 MXN", jugadores: "5/7", imagen: "/tragamonedas.png" },
  { id: 2, nombre: "Ruleta en Vivo", tipo: "VIP", limites: "$50 - $20,000 MXN", jugadores: "16", imagen: "/ruleta.png" },
  { id: 3, nombre: "Baccarat en Vivo", tipo: "VIP 2", limites: "$100 - $15,000 MXN", jugadores: "9/9", imagen: "/rasca.png" },
  { id: 4, nombre: "Poker en Vivo", tipo: "Texas Hold'em", limites: "$200 - $10,000 MXN", jugadores: "6/6", imagen: "/blackjack-vip.png" },
  { id: 5, nombre: "Casino Hold'em", tipo: "VIP", limites: "$100 - $8,000 MXN", jugadores: "4/7", imagen: "/mesa-en-vivo.png" },
];

const RECENT_WINNERS = [
  { id: 1, nombre: "Miguel Rojas", juego: "Blackjack VIP 3", premio: "$ 7,500 MXN" },
  { id: 2, nombre: "Laura Torres", juego: "Ruleta en Vivo", premio: "$ 5,200 MXN" },
  { id: 3, nombre: "Javier Medina", juego: "Baccarat VIP 2", premio: "$ 4,800 MXN" },
  { id: 4, nombre: "Sofía Ramírez", juego: "Blackjack VIP 1", premio: "$ 3,600 MXN" },
  { id: 5, nombre: "Ana López", juego: "Poker en Vivo", premio: "$ 3,100 MXN" },
];

export default function MesaEnVivoPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance, updateBalance } = useBalanceStore();
  const { addNotification } = useNotificationStore();

  // Permiso de Micrófono
  const [micStatus, setMicStatus] = useState<"prompt" | "granted" | "denied">("prompt");

  // Estados interactivos
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Estados del juego en vivo
  const [selectedChip, setSelectedChip] = useState(500);
  const [hasPlacedBet, setHasPlacedBet] = useState(false);
  const [gameMessage, setGameMessage] = useState("Esperando la siguiente ronda...");
  
  // Chat interactivo
  const [messages, setMessages] = useState([
    { id: 1, user: "JugadorMX", text: "¡Buena mano!", time: "15:31" },
    { id: 2, user: "SuerteTotal", text: "Vamos por más 🍀", time: "15:31" },
    { id: 3, user: "BlackKing", text: "¡Increíble! 🔥", time: "15:32" },
    { id: 4, user: "Sofia (Dealer)", text: "¡Buena suerte a todos!", time: "15:32" },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const formatMoney = (amount: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  // --- ESCUCHADOR PANTALLA COMPLETA VIDEO ---
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error al intentar pantalla completa: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    if (!isFavorite) {
      addNotification("Mesa agregada a tus favoritos.");
    } else {
      addNotification("Mesa eliminada de tus favoritos.");
    }
  };

  // Solicitar Permiso de Micrófono
  const requestMicAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicStatus("granted");
      addNotification("Acceso al micrófono concedido correctamente.");
    } catch (err) {
      console.error("Error al acceder al micrófono:", err);
      setMicStatus("denied");
    }
  };

  // Simulación de apuestas en vivo y ganancias aleatorias
  const handlePlaceBet = () => {
    if (balance < selectedChip) {
      alert("Saldo insuficiente para realizar esta apuesta en vivo.");
      return;
    }
    updateBalance(-selectedChip);
    setHasPlacedBet(true);
    setGameMessage("Apuesta aceptada. Esperando resultado del crupier...");

    setTimeout(() => {
      const won = Math.random() > 0.4;
      if (won) {
        const reward = selectedChip * 2;
        updateBalance(reward);
        setGameMessage(`¡Felicidades! Ganaste ${formatMoney(reward)}`);
        addNotification(`¡Mesa en Vivo: Ganaste ${formatMoney(reward)}!`);
      } else {
        setGameMessage("La casa gana esta ronda. ¡Suerte en la próxima!");
      }
      setHasPlacedBet(false);
    }, 4000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now(), user: user?.participante?.alias || "Tú", text: inputMessage, time: timeNow }]);
    setInputMessage("");
    
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (!user) return <div className="min-h-screen bg-[#05050A]"></div>;

  // 1. PANTALLA DE BLOQUEO DE MICRÓFONO
  if (micStatus === "prompt" || micStatus === "denied") {
    return (
      <div className="fixed inset-0 z-[100] bg-[#05050A] flex items-center justify-center p-4 bg-[url('/fondo.png')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md"></div>
        <div className="bg-[#0B0E14] border border-[#8A2BE2]/30 rounded-3xl p-8 max-w-md w-full text-center relative z-10 shadow-[0_0_50px_rgba(138,43,226,0.15)] animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-[#1E1133] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#8A2BE2]/30 shadow-inner">
            <Mic size={32} className="text-[#A78BFA]" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Acceso a la Sala en Vivo</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Para interactuar con la crupier profesional y participar en el chat de la <strong>Mesa en Vivo</strong>, necesitamos acceso a tu micrófono.
          </p>
          
          {micStatus === "denied" ? (
            <div className="bg-red-950/30 border border-red-500/30 p-4 rounded-xl mb-6 flex items-start gap-3 text-left">
              <ShieldAlert size={20} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">Permiso denegado. Habilita el micrófono en la configuración de tu navegador para unirte.</p>
            </div>
          ) : null}

          <div className="space-y-3">
            <button 
              onClick={requestMicAccess}
              className="w-full bg-[#3B2063] hover:bg-[#4A297C] text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-xs transition-colors shadow-lg"
            >
              Permitir Micrófono
            </button>
            <button 
              onClick={() => router.push("/juegos")}
              className="w-full bg-transparent hover:bg-white/5 border border-white/10 text-gray-400 hover:text-white font-bold py-3.5 rounded-xl uppercase tracking-widest text-xs transition-colors"
            >
              Volver al Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. INTERFAZ PRINCIPAL DE MESA EN VIVO
  return (
    <div className="min-h-screen bg-[#06080E] text-white font-sans pb-16 px-4 lg:px-8 pt-6 selection:bg-[#8A2BE2]/30">
      
      {/* HEADER SUPERIOR */}
      <div className="max-w-[1500px] mx-auto mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Mesa en Vivo
              <span className="bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span> En vivo
              </span>
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">Disfruta la emoción de un casino real desde donde estés.</p>
          </div>
        </div>

        {/* Estadísticas de la plataforma */}
        <div className="flex items-center gap-6 bg-[#0B0E14] border border-white/5 px-6 py-2.5 rounded-2xl shadow-inner">
          <div className="flex items-center gap-3">
            <Radio size={16} className="text-[#D4AF37]" />
            <div>
              <span className="text-base font-bold text-white block leading-none">56</span>
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Mesas en vivo</span>
            </div>
          </div>
          <div className="w-px h-8 bg-white/5"></div>
          <div className="flex items-center gap-3">
            <Users size={16} className="text-[#8A2BE2]" />
            <div>
              <span className="text-base font-bold text-white block leading-none">1,243</span>
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Jugadores en vivo</span>
            </div>
          </div>
          <div className="w-px h-8 bg-white/5"></div>
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-blue-400" />
            <div>
              <span className="text-base font-bold text-white block leading-none">24 / 7</span>
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Dealers profesionales</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL: 2 COLUMNAS */}
      <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* COLUMNA IZQUIERDA Y CENTRO (STREAM + CONTROLES) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* VENTANA DE VIDEO (CON PANTALLA COMPLETA Y FAVORITO FUNCIONALES) */}
          <div 
            ref={videoContainerRef} 
            className="relative w-full aspect-[16/9] max-h-[520px] rounded-3xl overflow-hidden bg-[#0B0E14] border border-white/10 shadow-2xl group flex flex-col justify-between"
          >
            
            <div className="absolute inset-0 bg-[url('/mesa-en-vivo.png')] bg-cover bg-center filter brightness-90"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#06080E] via-transparent to-black/60 pointer-events-none"></div>

            {/* Badges superiores */}
            <div className="relative flex justify-between items-center p-4 sm:p-6 z-10">
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white font-black text-[10px] px-3 py-1 rounded-md uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span> EN VIVO
                </span>
                <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-md border border-white/10 text-xs font-bold text-white">
                  Blackjack en Vivo
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* BOTÓN FAVORITO FUNCIONAL */}
                <button 
                  onClick={toggleFavorite} 
                  className={`w-9 h-9 rounded-xl backdrop-blur-md border flex items-center justify-center transition-colors ${isFavorite ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.5)]' : 'bg-black/50 border-white/10 text-gray-300 hover:text-white'}`}
                  title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                >
                  <Star size={16} className={isFavorite ? 'fill-black' : ''} />
                </button>

                {/* BOTÓN PANTALLA COMPLETA FUNCIONAL */}
                <button 
                  onClick={toggleFullScreen} 
                  className="w-9 h-9 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                  title={isFullscreen ? "Minimizar" : "Pantalla Completa"}
                >
                  {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </button>
              </div>
            </div>

            {/* Info inferior en el stream */}
            <div className="relative p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 z-10">
              <div>
                <p className="text-[#D4AF37] font-bold text-xs uppercase tracking-widest mb-1">Mesa VIP 1</p>
                <p className="text-sm font-medium text-gray-200">{gameMessage}</p>
              </div>

              <div className="bg-[#0B0E14]/90 backdrop-blur-md border border-[#D4AF37]/40 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-2xl">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest">Saldo Disponible</p>
                  <p className="text-base font-black text-[#D4AF37]">{formatMoney(balance)}</p>
                </div>
                <button 
                  onClick={handlePlaceBet}
                  disabled={hasPlacedBet}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#F3D55B] hover:from-[#F3D55B] hover:to-[#FFF1A0] text-black font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg disabled:opacity-50"
                >
                  {hasPlacedBet ? "Jugando..." : `Apostar ${formatMoney(selectedChip)}`}
                </button>
              </div>
            </div>

          </div>

          {/* BARRA DE SELECCIÓN DE FICHAS */}
          <div className="bg-[#0B0E14] border border-white/5 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Selecciona tu ficha:</span>
            <div className="flex items-center gap-3">
              {CHIP_VALUES.map((val) => (
                <button
                  key={val}
                  onClick={() => setSelectedChip(val)}
                  className={`w-12 h-12 rounded-full border-4 border-dashed flex items-center justify-center font-bold text-xs transition-all ${
                    selectedChip === val 
                      ? "border-purple-400 bg-purple-900 text-white scale-110 shadow-[0_0_15px_rgba(138,43,226,0.8)]" 
                      : "border-white/40 bg-[#131722] text-gray-300 hover:bg-[#1E1133]"
                  }`}
                >
                  {val >= 1000 ? `${val/1000}K` : val}
                </button>
              ))}
            </div>
            <span className="text-xs font-mono text-[#D4AF37]">Seleccionada: {formatMoney(selectedChip)}</span>
          </div>

        </div>

        {/* COLUMNA DERECHA (INFORMACIÓN + GANADORES + CHAT) */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-[#0B0E14] border border-white/5 rounded-3xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pb-2 border-b border-white/5">Información de la Mesa</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">Juego</span><span className="font-bold text-white">Blackjack en Vivo</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Mesa</span><span className="font-bold text-white">VIP 1</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Límites</span><span className="font-bold text-white">$100 - $10,000 MXN</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Jugadores</span><span className="font-bold text-white">7 / 7</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Estado</span><span className="font-bold text-green-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> En vivo</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Dealer</span><span className="font-bold text-[#D4AF37]">Sofía (★ 4.9)</span></div>
            </div>
          </div>

          <div className="bg-[#0B0E14] border border-white/5 rounded-3xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pb-2 border-b border-white/5 flex items-center gap-2">
              <Trophy size={14} className="text-[#D4AF37]" /> Ganadores Recientes
            </h3>
            <div className="space-y-3">
              {RECENT_WINNERS.map((win, idx) => (
                <div key={win.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-gray-600">{idx + 1}</span>
                    <div>
                      <p className="font-bold text-white leading-tight">{win.nombre}</p>
                      <p className="text-[10px] text-gray-500">{win.juego}</p>
                    </div>
                  </div>
                  <span className="font-bold text-green-400">{win.premio}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0B0E14] border border-white/5 rounded-3xl p-5 shadow-xl flex flex-col h-[300px]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chat de la Mesa</h3>
              <span className="text-[10px] text-gray-500 flex items-center gap-1"><Users size={12}/> 57</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar text-xs">
              {messages.map(msg => (
                <div key={msg.id} className="leading-tight">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-[#A78BFA]">{msg.user}</span>
                    <span className="text-[9px] text-gray-600">{msg.time}</span>
                  </div>
                  <p className="text-gray-300 bg-white/5 p-2 rounded-xl">{msg.text}</p>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={handleSendMessage} className="mt-3 flex items-center gap-2 pt-2 border-t border-white/5">
              <input 
                type="text" 
                placeholder="Escribe un mensaje..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-[#131722] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8A2BE2]"
              />
              <button type="submit" className="w-8 h-8 rounded-xl bg-[#3B2063] hover:bg-[#4A297C] text-white flex items-center justify-center shrink-0 transition-colors">
                <Send size={14} />
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* OTRAS MESAS EN VIVO */}
      <div className="max-w-[1500px] mx-auto mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold tracking-widest text-white uppercase">Otras Mesas en Vivo</h2>
          <div className="flex items-center gap-3">
            <button className="text-xs font-bold text-[#8A2BE2] hover:text-purple-400 uppercase tracking-wider">Ver todas</button>
            <div className="flex gap-1.5">
              <button className="w-8 h-8 rounded-lg bg-[#131722] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white"><ChevronLeft size={16}/></button>
              <button className="w-8 h-8 rounded-lg bg-[#131722] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white"><ChevronRight size={16}/></button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {OTHER_TABLES.map(table => (
            <div key={table.id} className="bg-[#0B0E14] border border-white/5 rounded-2xl overflow-hidden shadow-lg group hover:border-[#8A2BE2]/50 transition-all">
              <div className="h-32 bg-cover bg-center relative" style={{ backgroundImage: `url(${table.imagen})` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-transparent"></div>
                <span className="absolute top-2 left-2 bg-red-600 text-white font-bold text-[8px] px-2 py-0.5 rounded uppercase">En vivo</span>
              </div>
              <div className="p-4 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">{table.nombre}</h4>
                  <p className="text-[10px] text-gray-400 mb-2">{table.tipo}</p>
                  <p className="text-xs font-mono text-[#D4AF37] mb-4">{table.limites}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[10px] text-gray-500 flex items-center gap-1"><Users size={12}/> {table.jugadores}</span>
                  <button onClick={() => addNotification(`Conectando a ${table.nombre}...`)} className="bg-[#3B2063] hover:bg-[#4A297C] text-white text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-lg transition-colors shadow">
                    Unirse
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}