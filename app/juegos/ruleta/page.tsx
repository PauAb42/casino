"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Star,
  Maximize,
  Plus, 
  Send,
  RotateCcw,
  XCircle,
  Play,
  Copy,
  Users,
  Bell, 
} from "lucide-react";
import { aCentavos, useBalanceStore } from "@/lib/balanceStore";
import { useNotificationStore } from "@/lib/notificationStore";
import { useSalaDeJuego } from "@/lib/useSalaDeJuego";
import { useSesionRequerida } from "@/lib/useSesionRequerida";
import { consultarEstadoDePermiso, pedirPermiso } from "@/lib/permisosLab";
import { registrarEvento } from "@/lib/eventos";

const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36,
];

const TOP_ROW = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
const MID_ROW = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
const BOT_ROW = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];

const ROULETTE_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const ROULETTE_GRADIENT = `conic-gradient(${ROULETTE_ORDER.map(
  (number, index) => {
    const pocketAngle = 360 / ROULETTE_ORDER.length;
    const start = index * pocketAngle;
    const end = (index + 1) * pocketAngle;
    const color =
      number === 0
        ? "#08783f"
        : RED_NUMBERS.includes(number)
          ? "#8f1515"
          : "#111111";

    return `${color} ${start}deg ${end}deg`;
  },
).join(",")})`;

const WHEEL_DURATION_MS = 5200;

const SIMULATED_CHAT_MESSAGES = [
  { user: "RuletaFan", text: "La mesa está muy activa hoy." },
  { user: "JugadorVIP", text: "Voy con el número 17 en esta ronda." },
  { user: "SuerteTotal", text: "Buena jugada en rojo." },
  { user: "MesaRoyal", text: "La siguiente ronda comienza en breve." },
  { user: "Ana Sofía", text: "Las apuestas están abiertas.", isDealer: true },
  { user: "VIP_Lucky", text: "Esta vez voy por la segunda docena." },
  { user: "CarlosR", text: "El último giro estuvo muy cerca." },
  { user: "Ana Sofía", text: "No se aceptan apuestas cuando la rueda está girando.", isDealer: true },
];

const INITIAL_RECENT_NUMBERS = [17, 7, 34, 2, 0, 25, 19, 6, 13, 30];

const INITIAL_CHAT_MESSAGES = [
  { id: 1, user: "JugadorVIP", text: "¡Buena suerte a todos!", isDealer: false },
  { id: 2, user: "JugadorActivo", text: "Vamos por esa.", isDealer: false },
  { id: 3, user: "RuletaFan", text: "Qué mesa tan increíble", isDealer: false },
  { id: 4, user: "SuerteTotal", text: "¡Se viene el número 17!", isDealer: false },
  { id: 5, user: "Ana Sofía", text: "¡Disfruten el juego!", isDealer: true },
];

const CHIPS = [
  { value: 10, label: "10", color: "bg-[#D4AF37] border-[#F3D55B] text-black" },
  { value: 50, label: "50", color: "bg-red-700 border-red-500 text-white" },
  { value: 100, label: "100", color: "bg-gray-900 border-gray-500 text-white" },
  { value: 500, label: "500", color: "bg-green-700 border-green-500 text-white" },
  { value: 1000, label: "1K", color: "bg-blue-700 border-blue-500 text-white" },
  { value: 5000, label: "5K", color: "bg-purple-700 border-purple-500 text-white" },
  { value: 10000, label: "10K", color: "bg-yellow-600 border-yellow-400 text-black" },
];

type BetKind = "number" | "dozen" | "column" | "low" | "high" | "even" | "odd" | "red" | "black";
type BetDraft = { key: string; label: string; kind: BetKind; value?: number; };
type Bet = BetDraft & { amount: number; };
type BetAction = { placements: Array<{ key: string; amount: number }>; };
type ChatMessage = { id: number; user: string; text: string; isDealer: boolean; };

const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 });

function isRed(number: number) { return RED_NUMBERS.includes(number); }

/**
 * El vocabulario de la mesa y el de la API son el mismo, salvo el nombre.
 *
 * La tabla de pagos ya no vive en este archivo: la aplica el motor del servidor.
 * Lo unico que sube el cliente es **que** se apuesta y **cuanto**, y lo que baja
 * es el numero que salio y el retorno de cada ficha. Girar la ruleta con
 * `crypto.getRandomValues()` aqui parecia mas seguro que `Math.random()` y no lo
 * era: el problema nunca fue la calidad del azar, sino que quien lo generaba era
 * el mismo que apostaba.
 */
const TIPO_EN_LA_API: Record<BetKind, string> = {
  number: "numero",
  red: "rojo",
  black: "negro",
  even: "par",
  odd: "impar",
  low: "bajo",
  high: "alto",
  dozen: "docena",
  column: "columna",
};

export default function RuletaPage() {
  const router = useRouter();
  const { user, resolviendo } = useSesionRequerida();
  const saldo = useBalanceStore((s) => s.saldo);
  const notificar = useNotificationStore((s) => s.notificar); // avisos flotantes + campana

  /**
   * El permiso de notificaciones **no** bloquea la mesa.
   *
   * El banner de consentimiento del sitio promete "rechazar no te penaliza:
   * puedes seguir jugando igual", y esta sala hacia justo lo contrario: sin
   * notificaciones no se podía apostar. Ahora se pide, se registra y se explica
   * para qué sirve, pero la mesa está abierta desde el primer momento.
   */
  const [permisoNotificaciones, setPermisoNotificaciones] = useState<"prompt" | "granted" | "denied">("prompt");
  const [avisoDePermiso, setAvisoDePermiso] = useState<string | null>(null);
  const [mostrarInvitacion, setMostrarInvitacion] = useState(true);

  // La ronda con dinero la resuelve el servidor; `partida` es la telemetría del
  // recorrido para el estudio, que va aparte y no condiciona el juego.
  const { juegoId, apostando, error: errorDeRonda, apostar, limpiarError, partida } =
    useSalaDeJuego("ruleta");
  const { iniciar, registrarProgreso } = partida;

  const resultTimerRef = useRef<number | null>(null);
  const chatTimerRef = useRef<number | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [selectedChip, setSelectedChip] = useState(CHIPS[0].value);
  const [bets, setBets] = useState<Record<string, Bet>>({});
  const [betActions, setBetActions] = useState<BetAction[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [recentNumbers, setRecentNumbers] = useState(INITIAL_RECENT_NUMBERS);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [totalWagered, setTotalWagered] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Selecciona una ficha y realiza tu apuesta.");
  const [favorite, setFavorite] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatMessages]);

  /**
   * Rehidratación del permiso.
   *
   * Antes esto solo miraba `Notification.permission` y, si ya estaba concedido,
   * desbloqueaba la mesa sin llamar a `iniciar()`: las apuestas se pintaban sin
   * quedar asociadas a ninguna partida del backend. Ahora la mesa se abre igual
   * (el permiso nunca fue un requisito) y `iniciar()` corre siempre al montar.
   */
  useEffect(() => {
    if (!user) return;

    void (async () => {
      await iniciar({ sala: "ruleta" });

      const estado = await consultarEstadoDePermiso("notifications");
      if (estado.navegador === "granted") {
        setPermisoNotificaciones("granted");
        setMostrarInvitacion(false);
      } else if (estado.navegador === "denied") {
        setPermisoNotificaciones("denied");
        setMostrarInvitacion(false);
      }
    })();
  }, [user, iniciar]);

  /**
   * El permiso pasa por el laboratorio: `POST /permisos` registra que la mesa lo
   * pidió y `PATCH /permisos/:id/respuesta` anota qué contestaste y en cuántos
   * milisegundos. Cerrar el diálogo sin responder también queda registrado.
   *
   * El `juegoId` se lee en el momento de llamar y no de un render anterior: el
   * catálogo pudo terminar de cargar mientras la persona decidía, y con el valor
   * viejo el permiso se guardaría con `juego_id` nulo.
   */
  const solicitarNotificaciones = async () => {
    const resultado = await pedirPermiso("notifications", { juegoId });

    setPermisoNotificaciones(resultado.ok ? "granted" : "denied");
    setMostrarInvitacion(false);

    // El fallo de telemetría se informa, pero no cambia lo que decidió la
    // persona ni cierra la mesa.
    setAvisoDePermiso(resultado.errorDeRegistro ?? null);

    // El desenlace se dice siempre con el aviso del casino: si la persona negó
    // el permiso, la notificación nativa de abajo no puede contarle nada.
    notificar({
      titulo: resultado.ok ? "Notificaciones activadas" : "Notificaciones bloqueadas",
      mensaje: resultado.ok
        ? "La mesa ya puede avisarte fuera de esta pestaña. El permiso sigue activo hasta que tú lo revoques."
        : "Seguirás viendo los resultados aquí dentro; la mesa no te avisará fuera de la pestaña.",
      tipo: resultado.ok ? "exito" : "info",
    });

    if (resultado.ok && "Notification" in window && Notification.permission === "granted") {
      new Notification("Mesa lista", {
        body: "Te avisaremos de los premios de la Ruleta Europea. ¡Buena suerte!",
        icon: "/ruleta.png",
      });
    }
  };

  useEffect(() => {
    if (!user) return;

    const savedTotalWagered = Number(window.localStorage.getItem("rouletteTotalWagered") ?? "0");
    const savedRoundsPlayed = Number(window.localStorage.getItem("rouletteRoundsPlayed") ?? "0");

    if (Number.isFinite(savedTotalWagered)) setTotalWagered(savedTotalWagered);
    if (Number.isFinite(savedRoundsPlayed)) setRoundsPlayed(savedRoundsPlayed);

    const scheduleMessage = () => {
      const delay = 7000 + Math.floor(Math.random() * 9000);
      return window.setTimeout(() => {
        const message = SIMULATED_CHAT_MESSAGES[Math.floor(Math.random() * SIMULATED_CHAT_MESSAGES.length)];
        setChatMessages((previous) => [
          ...previous.slice(-50), 
          { id: Date.now(), user: message.user, text: message.text, isDealer: Boolean(message.isDealer) },
        ]);
        chatTimerRef.current = scheduleMessage();
      }, delay);
    };

    chatTimerRef.current = scheduleMessage();

    return () => {
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      if (chatTimerRef.current) clearTimeout(chatTimerRef.current);
    };
  }, [user]);

  useEffect(() => { window.localStorage.setItem("rouletteTotalWagered", String(totalWagered)); }, [totalWagered]);
  useEffect(() => { window.localStorage.setItem("rouletteRoundsPlayed", String(roundsPlayed)); }, [roundsPlayed]);

  const currentBets = useMemo(() => Object.values(bets), [bets]);
  const totalBet = useMemo(() => currentBets.reduce((sum, bet) => sum + bet.amount, 0), [currentBets]);

  /**
   * Lo que queda por apostar: el saldo menos lo que ya hay puesto en la mesa.
   *
   * Las fichas por encima de esta cifra se deshabilitan en vez de dejarse
   * pulsables. Antes se veian activas, se podian seleccionar y al tocar el
   * tapete no pasaba nada visible salvo un mensaje de estado facil de perderse:
   * con el saldo de bienvenida, casi todas las fichas caian en ese caso y la
   * mesa parecia rota.
   */
  const disponible = useMemo(
    () => Math.round((saldo - totalBet) * 100) / 100,
    [saldo, totalBet],
  );
  const fichaMasBarata = CHIPS[0].value;
  const puedeApostar = disponible >= fichaMasBarata;

  // Si la ficha elegida deja de alcanzar, se baja sola a la mayor que si quepa.
  useEffect(() => {
    if (selectedChip <= disponible) return;

    const alcanzable = [...CHIPS].reverse().find((chip) => chip.value <= disponible);
    if (alcanzable) setSelectedChip(alcanzable.value);
  }, [disponible, selectedChip]);

  const numberStats = useMemo(() => {
    const counts = Array.from({ length: 37 }, (_, number) => ({
      number,
      count: recentNumbers.filter((item) => item === number).length,
    }));
    const hot = [...counts].sort((a, b) => b.count - a.count || a.number - b.number).slice(0, 5);
    const cold = [...counts].sort((a, b) => a.count - b.count || a.number - b.number).slice(0, 5);
    return { hot, cold };
  }, [recentNumbers]);

  const getNumberColor = (number: number) => {
    if (number === 0) return "bg-green-700 text-white";
    return isRed(number) ? "bg-red-700 text-white" : "bg-black text-white";
  };

  const getBetAmount = (key: string) => bets[key]?.amount ?? 0;

  /**
   * Colocar una ficha ya **no** mueve el saldo.
   *
   * Las fichas del tapete son una intención, no un cargo: el dinero sale de la
   * cuenta una sola vez, cuando el servidor abre la ronda. Antes cada `addBet`
   * restaba del saldo local y cada `undo` lo devolvía, así que un fallo a mitad
   * dejaba el saldo descuadrado sin que nada lo detectara.
   */
  const addBet = (draft: BetDraft) => {
    if (spinning || apostando) { setStatusMessage("Espera a que termine el giro."); return; }
    if (selectedChip > disponible) {
      setStatusMessage(
        `Te quedan ${currency.format(disponible)} disponibles: no alcanza para una ficha de ${currency.format(selectedChip)}.`,
      );
      return;
    }

    setBets((previous) => {
      const current = previous[draft.key];
      return { ...previous, [draft.key]: { ...draft, amount: (current?.amount ?? 0) + selectedChip } };
    });

    setBetActions((previous) => [...previous, { placements: [{ key: draft.key, amount: selectedChip }] }]);
    setStatusMessage(`Apuesta de ${currency.format(selectedChip)} en ${draft.label}.`);
  };

  const undoLastBet = () => {
    if (spinning || apostando || betActions.length === 0) return;
    const lastAction = betActions[betActions.length - 1];

    setBets((previous) => {
      const next = { ...previous };
      for (const placement of lastAction.placements) {
        const current = next[placement.key];
        if (!current) continue;
        const newAmount = current.amount - placement.amount;
        if (newAmount <= 0) { delete next[placement.key]; }
        else { next[placement.key] = { ...current, amount: newAmount }; }
      }
      return next;
    });

    setBetActions((previous) => previous.slice(0, -1));
    setStatusMessage("Se deshizo la última acción.");
  };

  const clearBets = () => {
    if (spinning || apostando || totalBet === 0) return;
    setBets({});
    setBetActions([]);
    setStatusMessage("Todas las apuestas fueron retiradas.");
  };

  const doubleBets = () => {
    if (spinning || apostando || totalBet === 0) return;
    if (saldo < totalBet * 2) { setStatusMessage("No tienes saldo suficiente para doblar."); return; }

    const placements = currentBets.map((bet) => ({ key: bet.key, amount: bet.amount }));
    setBets((previous) => {
      const next = { ...previous };
      for (const bet of currentBets) { next[bet.key] = { ...bet, amount: bet.amount * 2 }; }
      return next;
    });

    setBetActions((previous) => [...previous, { placements }]);
    setStatusMessage("Tus apuestas se duplicaron.");
  };

  /**
   * Girar.
   *
   * El orden es el que cambia todo: **primero se pide la ronda al servidor** y
   * solo cuando responde empieza la animación, que se calcula para parar en el
   * número que ya salió. Antes era al revés —el cliente sorteaba, animaba y se
   * acreditaba a sí mismo el premio—, y por eso el resultado era manipulable
   * desde las herramientas del navegador y no quedaba nada auditable después.
   *
   * La rueda tarda lo mismo en girar; lo que cambia es quién decidió dónde para.
   */
  const spin = async () => {
    if (spinning || apostando) return;
    if (totalBet === 0) { setStatusMessage("Coloca al menos una apuesta antes de girar."); return; }

    limpiarError();
    setStatusMessage("Registrando tu apuesta…");

    const apuestas = currentBets.map((bet) => ({
      tipo: TIPO_EN_LA_API[bet.kind],
      valor: bet.value ?? null,
      monto_centavos: aCentavos(bet.amount),
    }));

    const stakeSnapshot = totalBet;
    const nueva = await apostar({ apuestas });

    if (!nueva) {
      // El hook ya dejó el motivo en `errorDeRonda`; el saldo no se tocó.
      setStatusMessage("No se pudo registrar la apuesta.");
      return;
    }

    const desenlace = nueva.desenlace as { numero: number } | null;
    const result = desenlace?.numero ?? 0;
    const totalReturn = nueva.premio_mxn;
    const netResult = nueva.neto_mxn;

    const resultIndex = ROULETTE_ORDER.indexOf(result);
    const extraSpins = 5;
    const newWheelRotation = wheelRotation + (360 * extraSpins);
    const targetAngle = resultIndex * (360 / 37);
    const finalAbsoluteAngle = newWheelRotation + targetAngle;

    const currentBallMod = ballRotation % 360;
    const targetMod = finalAbsoluteAngle % 360;
    let diff = targetMod - currentBallMod;
    if (diff > 0) diff -= 360;
    const newBallRotation = ballRotation - (360 * 6) + diff;

    setSpinning(true);
    setLastResult(null);
    setStatusMessage("La ruleta está girando...");
    setWheelRotation(newWheelRotation);
    setBallRotation(newBallRotation);

    setTotalWagered((previous) => previous + stakeSnapshot);
    setRoundsPlayed((previous) => previous + 1);

    // La telemetría va en lote (`POST /eventos`), no una petición por giro.
    registrarEvento("giro_ruleta", { apuesta: stakeSnapshot, apuestas: apuestas.length }, juegoId);

    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);

    // La espera es solo la animación: el dinero ya se movió y el número ya está
    // decidido y firmado en el comprobante de la ronda.
    resultTimerRef.current = window.setTimeout(() => {
      setRecentNumbers((previous) => [result, ...previous].slice(0, 20));
      setLastResult(result);

      void registrarProgreso(Math.max(0, Math.round(nueva.premio_centavos / 100)), {
        rondas: roundsPlayed + 1,
        ultimo_numero: result,
      });

      setBets({});
      setBetActions([]);
      setSpinning(false);

      if (totalReturn > 0) {
        setStatusMessage(`Salió el ${result}. Premio: ${currency.format(totalReturn)}. Resultado neto: ${netResult >= 0 ? "+" : ""}${currency.format(netResult)}.`);
        notificar({
          titulo: "¡Premio en la Ruleta!",
          mensaje: `Salió el ${result}. Ganaste ${currency.format(totalReturn)}.`,
          tipo: "exito",
        });

        /*
          El globo del sistema operativo se queda **solo aquí**, y a propósito.

          En el resto del sitio los avisos son los del casino (<Toaster />): una
          notificación nativa no se puede diseñar, y encima solo la ve quien
          concedió el permiso. Pero esta es la sala de la Notification API, y su
          lección es justo esa: el permiso que aceptaste hace unos giros sigue
          vivo, y el sitio te alcanza fuera de la pestaña sin volver a preguntar.
          Quitarlo dejaría el ejercicio sin la parte que se demuestra.
        */
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("¡Premio en Ruleta!", {
            body: `¡Felicidades! Has ganado ${currency.format(totalReturn)} en la Ruleta.`,
            icon: "/ruleta.png",
          });
        }
      } else {
        setStatusMessage(`Salió el ${result}. No hubo premio en esta ronda.`);
      }
    }, WHEEL_DURATION_MS);
  };

  const sendChatMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages((previous) => [
      ...previous,
      { id: Date.now(), user: user?.participante?.alias || "Jugador", text, isDealer: false },
    ]);
    setChatInput("");
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) { await document.documentElement.requestFullscreen(); } 
      else { await document.exitFullscreen(); }
    } catch { setStatusMessage("El navegador no permitió activar pantalla completa."); }
  };

  const BetBadge = ({ betKey }: { betKey: string }) => {
    const amount = getBetAmount(betKey);
    if (amount === 0) return null;
    return (
      <span className="absolute -top-2 -right-2 z-20 min-w-6 h-6 px-1 rounded-full bg-[#8A2BE2] border-2 border-[#D4AF37] text-[9px] font-black flex items-center justify-center shadow-lg">
        {amount >= 1000 ? `${amount / 1000}K` : amount}
      </span>
    );
  };

  const NumberCell = ({ number }: { number: number }) => {
    const key = `number:${number}`;
    return (
      <button
        type="button"
        onClick={() => addBet({ key, label: `Número ${number}`, kind: "number", value: number })}
        disabled={spinning}
        className={`relative flex-1 min-w-0 flex items-center justify-center border border-white/20 font-bold text-base lg:text-lg hover:brightness-125 disabled:opacity-60 cursor-pointer transition-all shadow-inner ${getNumberColor(number)}`}
        aria-label={`Apostar al número ${number}`}
      >
        {number}
        <BetBadge betKey={key} />
      </button>
    );
  };

  const OutsideBetButton = ({ draft, children, className = "" }: { draft: BetDraft; children: ReactNode; className?: string; }) => (
    <button
      type="button"
      onClick={() => addBet(draft)}
      disabled={spinning}
      className={`relative flex-1 flex items-center justify-center border border-white/20 text-gray-200 font-bold text-xs lg:text-sm hover:bg-white/10 disabled:opacity-60 transition-colors ${className}`}
    >
      {children}
      <BetBadge betKey={draft.key} />
    </button>
  );

  // `resolviendo` es "todavía no sé si hay sesión": pintar el esqueleto en vez
  // de redirigir es lo que evita perder la sesión al refrescar.
  if (resolviendo) return <div className="h-screen bg-[#05050A]" />;
  if (!user) return <div className="h-screen bg-[#05050A]" />;

  return (
    <div className="relative flex flex-col min-h-screen bg-[#05050A] text-white font-sans">

      {/*
        Invitación, no barrera.
        El banner de consentimiento del sitio promete que rechazar no penaliza y
        que se puede seguir jugando igual. Esta mesa lo contradecía: sin
        notificaciones no dejaba apostar. Ahora se ofrece, se explica para qué
        sirve y se puede seguir de largo — que es lo que ya decía el aviso.
      */}
      {mostrarInvitacion && permisoNotificaciones === "prompt" && (
        <div className="fixed bottom-4 right-4 z-[90] max-w-sm animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#0B0E14] border border-[#8A2BE2]/50 p-5 rounded-2xl shadow-[0_0_40px_rgba(138,43,226,0.25)] flex gap-4">
            <div className="w-10 h-10 shrink-0 bg-[#1E1133] rounded-full flex items-center justify-center border border-[#8A2BE2]/30">
              <Bell className="text-[#D4AF37]" size={20} />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-white mb-1">¿Te avisamos de los premios?</h2>
              <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                Podemos notificarte cuando ganes, aunque tengas la pestaña en segundo plano.
                <strong className="text-gray-300"> No hace falta para jugar</strong>: la mesa ya está abierta.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => void solicitarNotificaciones()}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#F3D55B] hover:from-[#F3D55B] hover:to-[#FFF1A0] text-black font-bold py-2 px-4 rounded-lg transition-all tracking-widest uppercase text-[10px]"
                >
                  Permitir
                </button>
                <button
                  onClick={() => setMostrarInvitacion(false)}
                  className="text-gray-500 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors px-3"
                >
                  Ahora no
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* El fallo de telemetría se informa como aviso; nunca cierra la mesa. */}
      {avisoDePermiso && (
        <div className="shrink-0 bg-amber-950/40 border-b border-amber-500/30 px-4 py-2 text-[11px] text-amber-200">
          El navegador respondió tu permiso, pero el laboratorio no pudo registrarlo: {avisoDePermiso}
        </div>
      )}

      {/* Errores de la apuesta (saldo insuficiente, mesa cerrada…). */}
      {errorDeRonda && (
        <div className="shrink-0 bg-red-950/40 border-b border-red-500/30 px-4 py-2 text-[11px] text-red-200 flex items-center justify-between gap-4">
          <span>{errorDeRonda}</span>
          <button onClick={limpiarError} className="text-red-300 hover:text-white font-bold uppercase tracking-widest">
            Cerrar
          </button>
        </div>
      )}

      <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 lg:px-6 shrink-0 bg-[#0B0E14]">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-white/10 transition-colors"
            aria-label="Volver"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Ruleta</h1>
            <p className="text-[11px] text-gray-400 uppercase tracking-widest">European Roulette</p>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
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

      <div className="flex-1 flex flex-col xl:flex-row p-3 lg:p-4 gap-4 items-start">
        <aside className="w-full xl:w-[280px] flex xl:flex-col gap-4 shrink-0">
          <div className="w-1/2 xl:w-full bg-[#0B0E14] border border-white/5 rounded-xl overflow-hidden shadow-lg">
            <div className="h-40 bg-gradient-to-b from-[#311452] via-[#1E1133] to-black relative flex items-center justify-center">
              <div className="absolute top-3 left-3 bg-green-600 text-white text-[9px] font-bold px-2 py-1 rounded shadow-md">EN VIVO</div>
              <div className="w-24 h-24 rounded-full bg-black/30 border border-[#D4AF37]/40 flex items-center justify-center text-3xl font-black tracking-widest text-[#D4AF37]">AS</div>
            </div>
            <div className="p-4 flex items-center justify-between bg-[#0B0E14]">
              <div>
                <p className="font-bold text-sm">Ana Sofía</p>
                <p className="text-[10px] text-gray-500">ID: 2354887</p>
              </div>
              <div className="flex items-center gap-1 bg-[#1E1133] border border-[#8A2BE2]/30 px-2 py-1 rounded text-xs">
                <Star size={12} className="text-[#D4AF37]" fill="currentColor" />
                <span className="font-bold">4.9</span>
              </div>
            </div>
          </div>

          <div className="w-1/2 xl:w-full xl:flex-1 bg-[#0B0E14] border border-white/5 rounded-xl shadow-lg flex flex-col overflow-hidden min-h-[220px]">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase">Chat</h3>
              <XCircle size={14} className="text-gray-500" />
            </div>
            <div 
              ref={chatContainerRef} 
              className="flex-1 overflow-y-auto p-4 space-y-3 text-sm max-h-[300px]"
            >
              {chatMessages.map((message) => (
                <div key={message.id} className="leading-tight">
                  <span className={`font-bold mr-2 ${message.isDealer ? "text-[#D4AF37]" : "text-[#8A2BE2]"}`}>{message.user}:</span>
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
                  placeholder="Escribe un mensaje..."
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-2 pl-3 pr-10 text-xs text-white focus:outline-none focus:border-[#8A2BE2] transition-colors"
                />
                <button type="button" onClick={sendChatMessage} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col gap-4 min-w-0">
          <section className="flex flex-col gap-4">
            <div className="min-h-[500px] xl:min-h-[620px] bg-[radial-gradient(circle_at_center,#21112f_0%,#0b0e14_55%,#05050a_100%)] border border-white/5 rounded-xl shadow-lg relative flex items-center justify-center overflow-hidden p-6 sm:p-8">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_20%,rgba(138,43,226,0.35),transparent_45%)]" />

              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                <div className="w-0 h-0 border-l-[11px] border-r-[11px] border-t-[18px] border-l-transparent border-r-transparent border-t-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
              </div>

              <div className="relative w-[360px] h-[360px] sm:w-[460px] sm:h-[460px] lg:w-[540px] lg:h-[540px] xl:w-[590px] xl:h-[590px]">
                <div
                  className="absolute inset-0 rounded-full border-[16px] border-[#6f461f] shadow-[0_0_55px_rgba(212,175,55,0.38),inset_0_0_35px_rgba(0,0,0,0.95)]"
                  style={{ transform: `rotate(${wheelRotation}deg)`, transition: `transform ${WHEEL_DURATION_MS}ms cubic-bezier(0.12,0.72,0.18,1)` }}
                >
                  <div className="absolute inset-[8px] rounded-full border-[7px] border-[#d4af37]" style={{ background: ROULETTE_GRADIENT }} />

                  {ROULETTE_ORDER.map((number, index) => {
                    const angle = index * (360 / ROULETTE_ORDER.length);
                    const isWinner = lastResult === number && !spinning;

                    return (
                      <div key={number} className="absolute inset-0 pointer-events-none" style={{ transform: `rotate(${angle}deg)` }}>
                        <span
                          className={`absolute left-1/2 top-[2.6%] w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black border ${
                            number === 0 ? "bg-green-700" : isRed(number) ? "bg-red-700" : "bg-black"
                          } ${isWinner ? "border-white ring-4 ring-[#D4AF37] scale-125 shadow-[0_0_22px_rgba(255,255,255,0.95)] z-20" : "border-white/30"}`}
                          style={{ transform: `translateX(-50%)` }}
                        >
                          {number}
                        </span>
                      </div>
                    );
                  })}

                  <div className="absolute inset-[23%] rounded-full bg-[radial-gradient(circle,#e4bc55_0%,#8a551e_18%,#251306_20%,#6f4018_45%,#180d08_70%)] border-[6px] border-[#d4af37] shadow-[inset_0_0_28px_rgba(0,0,0,0.9)]">
                    <div className="absolute inset-[34%] rounded-full bg-gradient-to-br from-[#f4d477] via-[#a56720] to-[#3f210c] border-4 border-[#f3d55b] shadow-xl" />
                  </div>
                </div>

                <div
                  className="absolute inset-[1.5%] rounded-full pointer-events-none z-20"
                  style={{ transform: `rotate(${ballRotation}deg)`, transition: `transform ${WHEEL_DURATION_MS}ms cubic-bezier(0.08,0.76,0.16,1)` }}
                >
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,1)] border-2 border-gray-300" />
                </div>

                <div className="absolute inset-[46%] rounded-full bg-[#d4af37] shadow-[0_0_22px_rgba(212,175,55,0.9)] pointer-events-none z-10" />
              </div>
            </div>
            
            {/*
              Sin saldo, el tapete deja de aceptar fichas. Decirlo aquí evita el
              peor síntoma posible: una mesa que parece funcionar y no responde.
            */}
            {!puedeApostar && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] leading-relaxed text-amber-200">
                  Te quedan <strong>{currency.format(disponible)}</strong> y la ficha más pequeña es de{" "}
                  {currency.format(fichaMasBarata)}. Recarga en el cajero para seguir apostando.
                </p>
                <button
                  onClick={() => router.push("/cajero")}
                  className="rounded-lg border border-amber-500/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-200 transition-colors hover:bg-amber-500/10"
                >
                  Ir al cajero
                </button>
              </div>
            )}

            <div className="bg-[#0B0E14] border border-white/5 rounded-xl shadow-lg p-4 flex flex-row items-center justify-between gap-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Estado de la ronda</p>
                <p className="text-sm md:text-base font-semibold">{statusMessage}</p>
              </div>

              <div className={`min-w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center shadow-2xl ${lastResult === null ? "bg-black/70 border-[#8A2BE2]" : `${getNumberColor(lastResult)} border-[#D4AF37]`}`}>
                <span className="text-[9px] uppercase tracking-widest">{spinning ? "Girando" : "Resultado"}</span>
                <span className="text-3xl font-black">{spinning ? "--" : lastResult ?? "--"}</span>
              </div>
            </div>

          </section>

          <section className="shrink-0 px-1 lg:px-4 pb-2 flex flex-col items-center overflow-x-auto">
            <div className="flex w-full min-w-[760px] max-w-[900px] h-[150px]">
              <button type="button" onClick={() => addBet({ key: "number:0", label: "Número 0", kind: "number", value: 0 })} disabled={spinning} className="relative w-12 border border-white/20 bg-green-700 flex items-center justify-center text-white font-bold text-lg rounded-l-lg hover:bg-green-600 disabled:opacity-60 transition-colors shadow-inner">
                0
                <BetBadge betKey="number:0" />
              </button>

              <div className="flex-1 flex flex-col">
                <div className="flex flex-1">{TOP_ROW.map((number) => <NumberCell key={number} number={number} />)}</div>
                <div className="flex flex-1">{MID_ROW.map((number) => <NumberCell key={number} number={number} />)}</div>
                <div className="flex flex-1">{BOT_ROW.map((number) => <NumberCell key={number} number={number} />)}</div>
              </div>

              <div className="w-12 flex flex-col text-sm font-bold text-gray-300">
                <OutsideBetButton draft={{ key: "column:3", label: "Columna superior", kind: "column", value: 3 }} className="rounded-tr-lg">2:1</OutsideBetButton>
                <OutsideBetButton draft={{ key: "column:2", label: "Columna central", kind: "column", value: 2 }}>2:1</OutsideBetButton>
                <OutsideBetButton draft={{ key: "column:1", label: "Columna inferior", kind: "column", value: 1 }}>2:1</OutsideBetButton>
              </div>
            </div>

            <div className="flex w-full min-w-[760px] max-w-[900px] pl-12 pr-12 h-12">
              <OutsideBetButton draft={{ key: "dozen:1", label: "Primera docena", kind: "dozen", value: 1 }}>1ST 12</OutsideBetButton>
              <OutsideBetButton draft={{ key: "dozen:2", label: "Segunda docena", kind: "dozen", value: 2 }}>2ND 12</OutsideBetButton>
              <OutsideBetButton draft={{ key: "dozen:3", label: "Tercera docena", kind: "dozen", value: 3 }}>3RD 12</OutsideBetButton>
            </div>

            <div className="flex w-full min-w-[760px] max-w-[900px] pl-12 pr-12 h-12 overflow-hidden">
              <OutsideBetButton draft={{ key: "outside:low", label: "1 a 18", kind: "low" }} className="rounded-bl-lg">1 - 18</OutsideBetButton>
              <OutsideBetButton draft={{ key: "outside:even", label: "Pares", kind: "even" }}>EVEN</OutsideBetButton>
              <OutsideBetButton draft={{ key: "outside:red", label: "Rojo", kind: "red" }} className="bg-red-800 hover:bg-red-700"><span className="w-4 h-4 bg-red-500 rotate-45" /></OutsideBetButton>
              <OutsideBetButton draft={{ key: "outside:black", label: "Negro", kind: "black" }} className="bg-black hover:bg-gray-900"><span className="w-4 h-4 bg-gray-700 rotate-45" /></OutsideBetButton>
              <OutsideBetButton draft={{ key: "outside:odd", label: "Impares", kind: "odd" }}>ODD</OutsideBetButton>
              <OutsideBetButton draft={{ key: "outside:high", label: "19 a 36", kind: "high" }} className="rounded-br-lg">19 - 36</OutsideBetButton>
            </div>
          </section>
        </main>

        <aside className="w-full xl:w-[320px] flex flex-col md:flex-row xl:flex-col gap-4 shrink-0 xl:pr-2">
          <section className="flex-1 bg-[#0B0E14] border border-white/5 rounded-xl p-5 shadow-lg space-y-6">
            <div>
              <h3 className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase mb-3">Números calientes</h3>
              <div className="flex justify-between gap-2">
                {numberStats.hot.map((item) => (
                  <div key={item.number} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border border-white/20 ${getNumberColor(item.number)}`}>{item.number}</div>
                    <span className="text-[9px] text-gray-500">{item.count}x</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase mb-3">Números fríos</h3>
              <div className="flex justify-between gap-2">
                {numberStats.cold.map((item) => (
                  <div key={item.number} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border border-white/20 ${getNumberColor(item.number)}`}>{item.number}</div>
                    <span className="text-[9px] text-gray-500">{item.count}x</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase mb-3">Últimos números</h3>
              <div className="flex flex-wrap gap-2">
                {recentNumbers.slice(0, 10).map((number, index) => (
                  <div key={`${number}-${index}`} className={`w-7 h-7 rounded flex items-center justify-center text-[11px] font-bold border border-white/20 ${getNumberColor(number)}`}>{number}</div>
                ))}
              </div>
            </div>
          </section>

          <section className="flex-1 bg-[#0B0E14] border border-white/5 rounded-xl p-5 shadow-lg min-h-[260px]">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
              <h3 className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">Tus apuestas</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500"><Users size={12} /> {currentBets.length}</div>
            </div>

            <div className="space-y-3 max-h-[230px] overflow-y-auto pr-1">
              {currentBets.length === 0 ? (
                <p className="text-xs text-gray-500">Todavía no has colocado apuestas.</p>
              ) : (
                currentBets.map((bet) => (
                  <div key={bet.key} className="flex justify-between gap-3 text-xs items-center">
                    <span className="text-gray-300 truncate">{bet.label}</span>
                    <span className="font-bold text-[#D4AF37]">{currency.format(bet.amount)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between text-sm items-center">
              <span className="text-gray-400 text-xs">Total apostado</span>
              <span className="font-bold text-white">{currency.format(totalBet)}</span>
            </div>
          </section>
        </aside>
      </div>

      <footer className="min-h-24 bg-[#0B0E14] border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-4 px-4 lg:px-6 py-3 shrink-0 relative z-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2">
          <div><p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Saldo</p><p className="font-bold text-white">{currency.format(saldo)}</p></div>
          <div><p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Apuesta actual</p><p className="font-bold text-white">{currency.format(totalBet)}</p></div>
          <div><p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Total apostado</p><p className="font-bold text-[#D4AF37]">{currency.format(totalWagered)}</p></div>
          <div><p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Rondas jugadas</p><p className="font-bold text-white">{roundsPlayed}</p></div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto max-w-full py-2">
          {CHIPS.map((chip) => (
            <button
              type="button"
              key={chip.value}
              onClick={() => setSelectedChip(chip.value)}
              disabled={spinning || chip.value > disponible}
              title={chip.value > disponible ? `No te alcanza: quedan ${currency.format(disponible)}` : undefined}
              className={`shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full border-4 flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-pointer transition-all ${chip.color} ${selectedChip === chip.value ? "-translate-y-2 ring-2 ring-[#D4AF37] shadow-[0_0_18px_rgba(212,175,55,0.55)]" : "hover:-translate-y-1"} disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed disabled:hover:translate-y-0`}
            >
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/20 flex items-center justify-center bg-black/20">{chip.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <button type="button" onClick={undoLastBet} disabled={spinning || apostando || betActions.length === 0} className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-white disabled:opacity-30 transition-colors px-2"><RotateCcw size={18} /> <span className="text-[9px] uppercase tracking-wider">Deshacer</span></button>
          <button type="button" onClick={doubleBets} disabled={spinning || apostando || totalBet === 0} className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-white disabled:opacity-30 transition-colors px-2"><Copy size={18} /> <span className="text-[9px] uppercase tracking-wider">Doblar</span></button>
          <button type="button" onClick={clearBets} disabled={spinning || apostando || totalBet === 0} className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-white disabled:opacity-30 transition-colors px-2"><XCircle size={18} /> <span className="text-[9px] uppercase tracking-wider">Borrar</span></button>
          <button type="button" onClick={() => void spin()} disabled={spinning || apostando || totalBet === 0} className="ml-1 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:border-gray-600 disabled:shadow-none border border-green-500 text-white flex items-center gap-2 px-5 lg:px-8 py-3 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(21,128,61,0.4)]"><Play size={18} className={spinning ? "animate-pulse" : ""} /> {apostando ? "REGISTRANDO..." : spinning ? "GIRANDO..." : "GIRAR"}</button>
        </div>
      </footer>
    </div>
  );
}