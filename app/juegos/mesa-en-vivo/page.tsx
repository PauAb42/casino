"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Mic, ShieldAlert, Star, Trophy, Users, 
  Clock, Send, ChevronLeft, ChevronRight, 
  Maximize, Minimize, Radio
} from "lucide-react";
import { aCentavos, useBalanceStore } from "@/lib/balanceStore";
import { useNotificationStore } from "@/lib/notificationStore";
import { useSalaDeJuego } from "@/lib/useSalaDeJuego";
import { useSesionRequerida } from "@/lib/useSesionRequerida";
import { useAvisoPendiente } from "@/lib/useAvisoPendiente";
import {
  cerrarMedios,
  consultarEstadoDePermiso,
  notarMedios,
  pedirPermiso,
  silenciarMedios,
} from "@/lib/permisosLab";

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

/** Lo que impide pedir el permiso mientras el aviso sigue sin responder. */
const TEXTO_AVISO = "Responde primero el aviso de privacidad que está en pantalla.";

export default function MesaEnVivoPage() {
  const avisoPendiente = useAvisoPendiente();
  const { user, resolviendo } = useSesionRequerida();
  const saldo = useBalanceStore((s) => s.saldo);
  const notificar = useNotificationStore((s) => s.notificar);

  // Permiso de Micrófono
  const [micStatus, setMicStatus] = useState<"prompt" | "granted" | "denied">("prompt");
  const [activacionId, setActivacionId] = useState<string | null>(null);
  // El cleanup de un efecto captura el valor del render en que se creó, así que
  // no puede leer `activacionId`. El ref siempre apunta al id vigente.
  const activacionRef = useRef<string | null>(null);
  const [silenciado, setSilenciado] = useState(false);
  const [loNote, setLoNote] = useState(false);
  const abiertoDesde = useRef<number | null>(null);

  // La ronda con dinero la resuelve el servidor.
  const { juegoId, apostando, error: errorDeRonda, apostar, limpiarError, partida } =
    useSalaDeJuego("mesa-en-vivo");
  const { iniciar, registrarProgreso } = partida;

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

  /**
   * Rehidratación del permiso de micrófono.
   *
   * `micStatus` arrancaba en `prompt` en cada montaje, así que volver a la mesa
   * exigía otra vez una autorización que el navegador ya tenía concedida.
   */
  useEffect(() => {
    if (!user) return;

    void (async () => {
      await iniciar({ sala: "mesa-en-vivo" });

      const estado = await consultarEstadoDePermiso("microphone");
      // `granted` en el navegador no significa que haya un stream vivo en esta
      // pestaña: el micrófono se vuelve a abrir cuando la persona lo pide, pero
      // ya no se le presenta como si nunca hubiera contestado.
      if (estado.navegador === "denied") setMicStatus("denied");
    })();
  }, [user, iniciar]);

  /**
   * Liberación del micrófono al desmontar.
   *
   * Esta sala abre el micrófono con `mantenerAbierto` y no tenía ninguna
   * limpieza: salir de la página sin pulsar "cerrar micrófono" dejaba la
   * activación viva en el backend para siempre. La instantánea auditada tenía
   * nueve activaciones "activas" y ninguna finalizada, justamente por esto.
   *
   * El cierre de la partida lo hace `usePartida` por su cuenta; aquí solo se
   * suelta el dispositivo. El ref es lo que permite que el efecto se monte una
   * sola vez: leer el estado directamente obligaría a re-suscribirlo en cada
   * cambio y la limpieza cerraría el micrófono a mitad de la sesión.
   */
  useEffect(() => {
    return () => {
      if (activacionRef.current) void cerrarMedios(activacionRef.current);
    };
  }, []);

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
    // Un favorito es un gesto trivial: se avisa en pantalla y no se guarda en la
    // campana, que es el historial de lo que importa.
    notificar({
      mensaje: isFavorite ? "Mesa eliminada de tus favoritos." : "Mesa agregada a tus favoritos.",
      tipo: "info",
      enBandeja: false,
    });
  };

  /**
   * Solicitar permiso de micrófono.
   *
   * El micrófono se queda **abierto** (`mantenerAbierto`), como en cualquier
   * mesa en vivo real, y eso es lo que hace útil el ejercicio: mientras siga
   * abierto el navegador muestra su indicador, y silenciar no lo apaga. Solo
   * `track.stop()` libera el dispositivo, y es lo que hace "Cerrar micrófono".
   */
  const requestMicAccess = async () => {
    // `iniciar()` NO se espera aquí: es telemetría del recorrido y hace una
    // petición de red. Esperarla antes de `pedirPermiso` gasta la activación
    // transitoria del clic, y varios navegadores solo muestran el diálogo si la
    // llamada ocurre dentro de ella. Va en paralelo, sin `await`.
    void iniciar({ sala: "mesa-en-vivo" });

    const resultado = await pedirPermiso("microphone", { juegoId, mantenerAbierto: true });

    if (resultado.ok) {
      setMicStatus("granted");
      setActivacionId(resultado.activacionId ?? null);
      activacionRef.current = resultado.activacionId ?? null;
      abiertoDesde.current = performance.now();
      notificar({
        titulo: "Micrófono abierto",
        mensaje: "Acceso al micrófono concedido: el indicador de tu navegador ya está encendido.",
        tipo: "aviso",
      });
    } else {
      setMicStatus("denied");
      notificar({ titulo: "Micrófono", mensaje: resultado.detalle, tipo: "error" });
    }
  };

  /** `track.enabled = false`: corta el audio y no libera el micrófono. */
  const alternarSilencio = async () => {
    if (!activacionId) return;
    const siguiente = !silenciado;
    setSilenciado(siguiente);
    await silenciarMedios(activacionId, siguiente);
  };

  /** `track.stop()`: lo único que apaga el indicador del navegador. */
  const cerrarMicrofono = async () => {
    if (!activacionId) return;
    const { registrado, error } = await cerrarMedios(activacionId);
    setActivacionId(null);
    activacionRef.current = null;

    // El dispositivo ya está liberado pase lo que pase; lo que puede fallar es
    // dejarlo anotado, y eso se dice en vez de tragárselo.
    if (!registrado && error) notificar({ titulo: "Micrófono", mensaje: error, tipo: "error" });
    setSilenciado(false);
    setMicStatus("prompt");
    notificar({
      titulo: "Micrófono liberado",
      mensaje: "Micrófono liberado con track.stop(). Ahora sí se apagó el indicador.",
      tipo: "exito",
    });
  };

  /** "Lo noté": cuánto tardaste en ver que el micrófono estaba abierto. */
  const marcarQueLoNote = async () => {
    if (!activacionId) return;
    const ms = abiertoDesde.current === null ? null : Math.round(performance.now() - abiertoDesde.current);
    await notarMedios(activacionId, ms);
    setLoNote(true);
  };

  // Simulación de apuestas en vivo y ganancias aleatorias
  /**
   * Apostar en vivo.
   *
   * El crupier lo resuelve el servidor. La espera de cuatro segundos es puesta
   * en escena —la mano ya está decidida cuando arranca— y no una simulación:
   * antes esos cuatro segundos escondían un `Math.random() > 0.4` del cliente
   * que se acreditaba a sí mismo el doble de la apuesta.
   */
  const handlePlaceBet = async () => {
    // `alert()` bloqueaba la mesa —vídeo, chat y crupier incluidos— hasta que
    // alguien pulsara "Aceptar" en un diálogo del navegador. El aviso flotante
    // informa igual, con el diseño de la sala y sin detenerla.
    if (saldo < selectedChip) {
      notificar({
        titulo: "Saldo insuficiente",
        mensaje: `Esa ficha vale ${formatMoney(selectedChip)} y tu saldo es de ${formatMoney(saldo)}. Elige una ficha menor o recarga en el cajero.`,
        tipo: "aviso",
      });
      return;
    }

    limpiarError();
    setGameMessage("Registrando tu apuesta...");

    const ronda = await apostar({ monto_centavos: aCentavos(selectedChip) });

    if (!ronda) {
      setGameMessage("No se pudo registrar la apuesta.");
      return;
    }

    setHasPlacedBet(true);
    setGameMessage("Apuesta aceptada. Esperando resultado del crupier...");

    const desenlace = ronda.desenlace as
      | { mano_jugador: number; mano_banca: number; resultado: string }
      | null;

    setTimeout(() => {
      if (ronda.premio_centavos > 0) {
        setGameMessage(
          `¡Felicidades! Ganaste ${formatMoney(ronda.premio_mxn)} ` +
            `(${desenlace?.mano_jugador} contra ${desenlace?.mano_banca})`,
        );
        notificar({
          titulo: "¡Ganaste en Mesa en Vivo!",
          mensaje: `El crupier pagó ${formatMoney(ronda.premio_mxn)} a tu mano.`,
          tipo: "exito",
        });
        void registrarProgreso(Math.round(ronda.premio_centavos / 100), {
          apuesta: selectedChip,
          resultado: desenlace?.resultado ?? "gano",
        });
      } else {
        setGameMessage(
          `La casa gana esta ronda (${desenlace?.mano_jugador} contra ${desenlace?.mano_banca}). ¡Suerte en la próxima!`,
        );
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

  if (resolviendo || !user) return <div className="min-h-screen bg-[#05050A]" />;

  // 2. INTERFAZ PRINCIPAL DE MESA EN VIVO
  return (
    <div className="min-h-screen bg-[#06080E] text-white font-sans pb-16 px-4 lg:px-8 pt-6 selection:bg-[#8A2BE2]/30">
      
      {/*
        Petición de micrófono como banner, no como muro.

        Antes esto era una pantalla de bloqueo: sin micrófono no se veía la mesa.
        Contradecía el aviso del propio sitio ("rechazar no te penaliza: puedes
        seguir jugando igual") e impedía el acceso al producto por un permiso que
        la mesa no necesita para aceptar una apuesta.
      */}
      {micStatus !== "granted" && (
        <div className="max-w-[1500px] mx-auto mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-[#8A2BE2]/30 bg-[#1E1133]/40 px-5 py-3">
          <Mic size={16} className="text-[#A78BFA] shrink-0" />
          <p className="flex-1 min-w-[240px] text-[11px] leading-relaxed text-gray-300">
            {micStatus === "denied" ? (
              <>
                <ShieldAlert size={12} className="inline mr-1 text-red-400" />
                No se concedió el micrófono. <strong className="text-gray-200">La mesa sigue abierta</strong>: solo no podrás hablar con la crupier.
              </>
            ) : (
              <>
                Esta sala pide tu <strong className="text-gray-200">micrófono</strong> para &quot;hablar con la crupier&quot;.
                No hace falta para apostar. Si lo concedes, fíjate en que el indicador del navegador
                se queda encendido: silenciar no lo apaga, solo <code className="text-[#A78BFA]">track.stop()</code>.
              </>
            )}
          </p>
          <>
            {avisoPendiente && (
              <p className="w-full text-[10px] leading-relaxed text-amber-300">{TEXTO_AVISO}</p>
            )}
            <button
              disabled={avisoPendiente}
              title={avisoPendiente ? TEXTO_AVISO : undefined}
              onClick={() => void requestMicAccess()}
              className="disabled:opacity-40 disabled:cursor-not-allowed rounded-lg border border-[#8A2BE2]/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#A78BFA] transition-colors hover:bg-[#8A2BE2]/20"
            >
              {micStatus === "denied" ? "Reintentar" : "Permitir"} micrófono
            </button>
          </>
        </div>
      )}

      {/* Errores de la apuesta: saldo insuficiente, sala cerrada, red caída. */}
      {errorDeRonda && (
        <div className="max-w-[1500px] mx-auto mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-950/30 px-5 py-3 text-[11px] text-red-200">
          <span>{errorDeRonda}</span>
          <button onClick={limpiarError} className="text-red-300 hover:text-white font-bold uppercase tracking-widest">
            Cerrar
          </button>
        </div>
      )}

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

        {/* Panel del micrófono abierto: silenciar corta el audio pero NO libera
            el dispositivo; el indicador del navegador sigue encendido hasta que
            se llama a track.stop(). Es la lección central de esta sala. */}
        {activacionId && (
          <div className="w-full md:w-auto rounded-2xl border border-[#8A2BE2]/30 bg-[#1E1133]/40 px-5 py-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#A78BFA]">
                {silenciado ? "Silenciado, pero abierto" : "Micrófono abierto"}
              </p>
            </div>
            <p className="mb-3 max-w-xs text-[11px] leading-relaxed text-gray-400">
              {silenciado
                ? "No se envía audio, pero el dispositivo sigue tomado: el indicador de tu navegador continúa encendido y la mesa puede reanudar sin volver a preguntarte."
                : "Mira la pestaña de tu navegador: ahí está el indicador de que alguien te escucha."}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void alternarSilencio()}
                className="rounded-lg border border-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:bg-white/5"
              >
                {silenciado ? "Reanudar" : "Silenciar"}
              </button>
              <button
                onClick={() => void cerrarMicrofono()}
                className="rounded-lg border border-red-500/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-300 hover:bg-red-500/10"
              >
                Cerrar micrófono
              </button>
              {!loNote && (
                <button
                  onClick={() => void marcarQueLoNote()}
                  className="rounded-lg border border-[#D4AF37]/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  Lo noté
                </button>
              )}
            </div>
          </div>
        )}

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
                  <p className="text-base font-black text-[#D4AF37]">{formatMoney(saldo)}</p>
                </div>
                <button 
                  onClick={() => void handlePlaceBet()}
                  disabled={hasPlacedBet || apostando}
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
                  <button onClick={() => notificar({ mensaje: `Conectando a ${table.nombre}...`, tipo: "info", enBandeja: false })} className="bg-[#3B2063] hover:bg-[#4A297C] text-white text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-lg transition-colors shadow">
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