"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, Crown, ShieldCheck, Camera, 
  CreditCard, Landmark, Coins, AlertCircle, Loader2,
  ChevronDown, ChevronUp, Info
} from "lucide-react";
import { aCentavos, useBalanceStore } from "@/lib/balanceStore";
import { useNotificationStore } from "@/lib/notificationStore";
import { useSesionRequerida } from "@/lib/useSesionRequerida";
import { ApiError, api } from "@/lib/api";
import { cerrarMedios, notarMedios, pedirPermiso, streamDe } from "@/lib/permisosLab";

const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 });

const DEPOSIT_METHODS = [
  { id: "credito", name: "Tarjeta de crédito", icon: CreditCard },
  { id: "debito", name: "Tarjeta de débito", icon: CreditCard },
  { id: "spei", name: "Transferencia SPEI", icon: Landmark },
  { id: "crypto", name: "Criptomonedas", icon: Coins }
];

const WITHDRAWAL_METHODS = [
  { id: "spei_retiro", name: "Transferencia SPEI / CLABE", icon: Landmark },
  { id: "debito_retiro", name: "Tarjeta de débito de destino", icon: CreditCard },
  { id: "crypto_retiro", name: "Billetera Crypto (USDT / BTC)", icon: Coins }
];

export default function CajeroPage() {
  const router = useRouter();
  const { user, resolviendo } = useSesionRequerida();
  const saldo = useBalanceStore((s) => s.saldo);
  const retiro = useBalanceStore((s) => s.retiro);
  const aplicarBilletera = useBalanceStore((s) => s.aplicarBilletera);
  const refrescarSaldo = useBalanceStore((s) => s.refrescar);
  const { addNotification } = useNotificationStore();

  const [errorDeCaja, setErrorDeCaja] = useState<string | null>(null);

  // Estados del Cajero
  const [activeTab, setActiveTab] = useState<"depositar" | "retirar">("depositar");
  const [amount, setAmount] = useState<string>("");
  const [activeMethod, setActiveMethod] = useState("debito"); // Acordeón abierto por defecto
  const [isProcessing, setIsProcessing] = useState(false);

  // Campos para Depósito (Tarjeta)
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Campos para Retiro (Cuenta destino)
  const [withdrawName, setWithdrawName] = useState("");
  const [withdrawClabe, setWithdrawClabe] = useState("");
  const [withdrawBank, setWithdrawBank] = useState("");

  // Estados de la Cámara (KYC)
  const [cameraStatus, setCameraStatus] = useState<"idle" | "requesting" | "scanning" | "verified" | "error">("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Limpieza de la cámara si el usuario navega fuera
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Cambiar método activo por defecto según la pestaña
  useEffect(() => {
    if (activeTab === "depositar") {
      setActiveMethod("debito");
    } else {
      setActiveMethod("spei_retiro");
    }
  }, [activeTab]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  /**
   * "Verificación biométrica" del retiro.
   *
   * La cámara se abre de verdad y queda registrada como activación de medios: de
   * la captura no se guarda ni un fotograma, solo cuánto duró, qué pistas se
   * abrieron y cuánto tardaste en notarlo. Al terminar se cierra con
   * `track.stop()` —lo único que apaga el indicador— y `POST /medios/:id/cierre`
   * anota la duración real.
   *
   * **Esto no verifica ninguna identidad y la interfaz lo dice.** No hay
   * comparación biométrica, ni documento, ni nada que pueda fallar: a los tres
   * segundos se declara verificada pase lo que pase. Ese es exactamente el
   * punto del ejercicio —enseñar cuánto se parece un teatro de seguridad a una
   * comprobación real— pero llamarlo "Verificación de Identidad" sin más lo
   * convertía en la misma confirmación vacía que el laboratorio critica.
   */
  const startVerification = async () => {
    setCameraStatus("requesting");

    const resultado = await pedirPermiso("camera", { mantenerAbierto: true });
    if (!resultado.ok || !resultado.activacionId) {
      setCameraStatus("error");
      return;
    }

    const activacionId = resultado.activacionId;
    const stream = streamDe(activacionId) ?? null;
    streamRef.current = stream;
    if (videoRef.current && stream) videoRef.current.srcObject = stream;

    setCameraStatus("scanning");
    const abiertoEn = performance.now();

    setTimeout(() => {
      void (async () => {
        setCameraStatus("verified");
        // Cierra en el backend y apaga el dispositivo en el navegador.
        await cerrarMedios(activacionId);
        await notarMedios(activacionId, Math.round(performance.now() - abiertoEn));
        streamRef.current = null;
        addNotification("Verificación completada. La cámara se liberó con track.stop().");
      })();
    }, 3000);
  };

  /**
   * Depósito y retiro.
   *
   * El banco sigue siendo simulado —no hay pasarela de pagos detrás— pero el
   * saldo que mueve es real: hay una billetera persistente, un movimiento
   * atómico y un asiento en el libro mayor que sobrevive al refresco. Esa es la
   * regla del laboratorio: el banco se puede simular **siempre que modifique el
   * saldo de verdad**.
   *
   * Dos cosas cambian respecto a la versión anterior:
   *
   * 1. **Ya no se escribe `saldo ± monto`.** Antes el importe se sumaba al saldo
   *    capturado al enviar el formulario, dos segundos después; si una partida
   *    lo modificaba durante la espera, el cajero sobrescribía el valor nuevo y
   *    esos movimientos desaparecían. Ahora el saldo lo calcula el backend y la
   *    respuesta trae el resultado.
   *
   * 2. **La clave de idempotencia se genera una vez por envío.** Si la respuesta
   *    se pierde por un timeout, reintentar con la misma clave devuelve el
   *    movimiento original en lugar de cobrar dos veces.
   */
  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) return;

    if (activeTab === "retirar" && numAmount > saldo) {
      setErrorDeCaja("No tienes saldo suficiente para este retiro.");
      return;
    }

    setErrorDeCaja(null);
    setIsProcessing(true);

    const cuerpo = {
      monto_centavos: aCentavos(numAmount),
      metodo: activeMethod,
      clave_idempotencia: crypto.randomUUID(),
    };

    try {
      if (activeTab === "depositar") {
        const { billetera, bono } = await api.billetera.depositar(cuerpo);
        aplicarBilletera(billetera);

        addNotification(`Tu depósito de ${currency.format(numAmount)} ha sido acreditado.`);

        // El bono de depósito se aplica aquí, no en la pantalla de promociones:
        // es el depósito el que lo activa.
        if (bono) {
          addNotification(
            `Se acreditó tu bono "${bono.promocion.titulo}": ` +
              `${currency.format(bono.movimiento.monto_mxn)} extra.`,
          );
        }
      } else {
        const { billetera } = await api.billetera.retirar(cuerpo);
        aplicarBilletera(billetera);

        addNotification(
          `Tu solicitud de retiro por ${currency.format(numAmount)} ha sido enviada para procesamiento.`,
        );
      }

      // Limpiar formulario
      setAmount("");
      setCardName("");
      setCardNumber("");
      setCardExp("");
      setCardCvv("");
      setWithdrawName("");
      setWithdrawClabe("");
      setWithdrawBank("");
    } catch (error) {
      // El 422 del rollover pendiente llega aquí con su motivo escrito.
      setErrorDeCaja(
        error instanceof ApiError ? error.message : "No se pudo completar la operación.",
      );
      void refrescarSaldo();
    } finally {
      setIsProcessing(false);
    }
  };

  const methodsList = activeTab === "depositar" ? DEPOSIT_METHODS : WITHDRAWAL_METHODS;

  if (resolviendo || !user) return <div className="h-screen bg-[#05050A]" />;

  return (
    <div className="min-h-screen bg-[#05050A] text-white font-sans flex flex-col">
      
      {/* HEADER CAJERO */}
      <header className="h-16 shrink-0 border-b border-white/5 flex items-center justify-between px-4 lg:px-6 bg-[#0B0E14] relative z-20">
        <div className="flex items-center gap-4 w-1/3">
          <button onClick={() => router.push("/")} className="flex items-center justify-center w-8 h-8 rounded border border-white/10 hover:bg-white/5 transition-colors">
            <ChevronLeft size={20} className="text-[#D4AF37]" />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-widest uppercase">Cajero Real</h1>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">Cifrado SSL 256-bit</p>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <Crown size={20} className="text-[#D4AF37] fill-[#D4AF37]/20 mb-0.5" />
          <h2 className="text-base font-serif font-bold text-[#D4AF37] leading-none tracking-widest drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">ROYAL</h2>
          <span className="text-[7px] font-sans tracking-[0.4em] text-[#D4AF37] mt-0.5">CASINO</span>
        </div>

        <div className="flex items-center justify-end w-1/3">
          <div className="flex items-center bg-[#131722] rounded-lg px-4 py-1.5 border border-white/10 shadow-inner">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest mr-2">Saldo Real:</span>
            <span className="font-black text-[#D4AF37] text-sm">{currency.format(saldo)}</span>
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="flex-1 flex flex-col items-center py-10 px-4 lg:px-8 relative overflow-y-auto custom-scrollbar">
        
        {/* Fondos estéticos */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(138,43,226,0.05),transparent_50%)] pointer-events-none" />

        {/* PANTALLA 1: VERIFICACIÓN DE CÁMARA (KYC) */}
        {cameraStatus !== "verified" ? (
          <div className="bg-[#0B0E14] border border-white/5 rounded-3xl p-8 shadow-2xl max-w-lg w-full flex flex-col items-center text-center relative z-10 my-auto animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-[#1E1133] rounded-full flex items-center justify-center mb-6 border border-[#8A2BE2]/30 shadow-[0_0_30px_rgba(138,43,226,0.3)]">
              <ShieldCheck className="text-[#8A2BE2]" size={32} />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Verificación de Identidad</h2>
            <p className="text-[10px] uppercase tracking-widest text-amber-400/80 mb-4 border border-amber-500/30 bg-amber-950/30 rounded px-2 py-1">Simulación: no se comprueba tu identidad</p>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              La cámara se abre de verdad y queda registrada, pero <strong>aquí no se compara nada</strong>:
              a los tres segundos esto se declara verificado pase lo que pase. Fíjate en cuánto se
              parece un trámite de seguridad a uno que no comprueba nada.
            </p>

            <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-[#131722] shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-black mb-8 flex items-center justify-center">
              {cameraStatus === "idle" && <Camera size={48} className="text-gray-600" />}
              {cameraStatus === "requesting" && (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-[#8A2BE2]" size={32} />
                  <span className="text-xs text-gray-500 uppercase tracking-widest">Conectando...</span>
                </div>
              )}
              {cameraStatus === "error" && (
                <div className="flex flex-col items-center gap-3 text-red-400 px-6">
                  <AlertCircle size={32} />
                  <span className="text-xs text-center">No se pudo acceder a la cámara. Revisa los permisos de tu navegador.</span>
                </div>
              )}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${cameraStatus === "scanning" ? "opacity-100" : "opacity-0"}`}
              />
              {cameraStatus === "scanning" && (
                <>
                  <div className="absolute inset-0 bg-[#8A2BE2]/10 mix-blend-overlay"></div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8A2BE2] to-transparent shadow-[0_0_15px_#8A2BE2] animate-[scan_2s_ease-in-out_infinite]"></div>
                  <div className="absolute inset-0 border-[6px] border-[#8A2BE2]/40 rounded-full animate-pulse pointer-events-none"></div>
                </>
              )}
            </div>

            {cameraStatus === "scanning" ? (
              <p className="text-[#8A2BE2] font-bold tracking-widest uppercase text-sm animate-pulse mb-2">
                Escaneando Biometría...
              </p>
            ) : (
              <button 
                onClick={startVerification}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F3D55B] hover:from-[#F3D55B] hover:to-[#FFF1A0] text-black font-black py-4 rounded-xl transition-all shadow-[0_5px_20px_rgba(212,175,55,0.2)] tracking-widest uppercase text-sm flex items-center justify-center gap-3"
              >
                <Camera size={18} /> {cameraStatus === "error" ? "Reintentar Verificación" : "Activar Cámara"}
              </button>
            )}
          </div>
        ) : (
          
          /* PANTALLA 2: EL CAJERO PROFESIONAL ESTILO ACORDEÓN */
          <div className="w-full max-w-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            
            {/* TABS DEPOSITAR / RETIRAR */}
            <div className="flex bg-[#18181b] rounded-xl p-1.5 border border-white/10 mb-8 mx-auto w-full max-w-md shadow-lg">
              <button 
                onClick={() => setActiveTab("depositar")}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === "depositar" ? "bg-[#27272a] text-white shadow-md" : "text-gray-400 hover:text-white"}`}
              >
                Depositar
              </button>
              <button 
                onClick={() => setActiveTab("retirar")}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === "retirar" ? "bg-[#27272a] text-white shadow-md" : "text-gray-400 hover:text-white"}`}
              >
                Retirar
              </button>
            </div>

            {/* Rollover pendiente: el bono todavía no es dinero retirable. */}
            {activeTab === "retirar" && retiro?.bloqueado && (
              <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-xs text-amber-200 leading-relaxed">
                <strong className="block mb-1">Retiro bloqueado por un bono activo</strong>
                {retiro.motivo} Te faltan {currency.format(retiro.rollover_pendiente_mxn)} de apuesta.
              </div>
            )}

            {errorDeCaja && (
              <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-200">
                {errorDeCaja}
              </div>
            )}

            {/* TÍTULO DINÁMICO */}
            <h2 className="text-xl font-bold mb-4">
              {activeTab === "depositar" ? "Selecciona el método de pago" : "Selecciona el método de retiro"}
            </h2>

            <div className="bg-[#1f1f22] rounded-xl overflow-hidden border border-[#333]">
              
              {methodsList.map((method, index) => {
                const isExpanded = activeMethod === method.id;
                
                return (
                  <div key={method.id} className={`${index !== 0 ? "border-t border-[#333]" : ""}`}>
                    
                    {/* Header del Acordeón */}
                    <button 
                      onClick={() => setActiveMethod(isExpanded ? "" : method.id)}
                      className={`w-full flex items-center justify-between p-5 transition-colors ${isExpanded ? "bg-[#27272a]" : "hover:bg-[#27272a]"}`}
                    >
                      <span className="font-bold text-base">{method.name}</span>
                      <div className="flex items-center gap-3">
                        <method.icon size={24} className="text-gray-400" />
                        {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                      </div>
                    </button>

                    {/* Contenido Expandido */}
                    {isExpanded && (
                      <div className="p-6 pt-2 bg-[#27272a]">
                        
                        {/* Logos de tarjetas sólo si es Depósito y por Tarjeta */}
                        {activeTab === "depositar" && (method.id === "credito" || method.id === "debito") && (
                          <div className="flex gap-2 mb-4">
                            <div className="bg-white rounded px-2 py-1 flex items-center justify-center">
                              <span className="text-[#E00034] font-black text-[10px] tracking-tighter">CARNET</span>
                            </div>
                            <div className="bg-white rounded px-2 py-1 flex items-center justify-center">
                              <div className="w-3 h-3 bg-red-500 rounded-full opacity-80 mix-blend-multiply -mr-1"></div>
                              <div className="w-3 h-3 bg-yellow-400 rounded-full opacity-80 mix-blend-multiply"></div>
                            </div>
                            <div className="bg-white rounded px-2 py-1 flex items-center justify-center">
                              <span className="text-[#1A1F71] font-black italic text-[10px]">VISA</span>
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-gray-400 mb-5">* indica un campo obligatorio.</p>

                        <form onSubmit={(e) => void handleTransaction(e)} className="space-y-5">
                          
                          {/* Campo: Monto */}
                          <div>
                            <label className="block text-sm font-bold mb-1">
                              Monto a {activeTab === "depositar" ? "depositar" : "retirar"} (MXN) *
                            </label>
                            <input 
                              type="number" 
                              required
                              min="100"
                              step="100"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="w-full bg-[#18181b] border border-[#444] rounded-md py-2.5 px-3 text-white focus:outline-none focus:border-white transition-colors"
                              placeholder="Ej. 1000"
                            />
                          </div>

                          {/* CAMPOS SEGÚN PESTAÑA: DEPÓSITO DE TARJETA */}
                          {activeTab === "depositar" && (method.id === "credito" || method.id === "debito") && (
                            <>
                              <div>
                                <label className="block text-sm font-bold mb-1">Nombre y apellido *</label>
                                <input 
                                  type="text" 
                                  required
                                  value={cardName}
                                  onChange={(e) => setCardName(e.target.value)}
                                  className="w-full bg-[#18181b] border border-[#444] rounded-md py-2.5 px-3 text-white focus:outline-none focus:border-white transition-colors"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-bold mb-1">Número de tarjeta *</label>
                                <input 
                                  type="text" 
                                  required
                                  maxLength={16}
                                  value={cardNumber}
                                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                                  className="w-full bg-[#18181b] border border-[#444] rounded-md py-2.5 px-3 text-white focus:outline-none focus:border-white transition-colors tracking-widest font-mono"
                                />
                              </div>

                              <div className="flex gap-4">
                                <div className="flex-1">
                                  <label className="block text-sm font-bold mb-1">Fecha de expiración *</label>
                                  <input 
                                    type="text" 
                                    required
                                    maxLength={4}
                                    value={cardExp}
                                    onChange={(e) => setCardExp(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-[#18181b] border border-[#444] rounded-md py-2.5 px-3 text-white focus:outline-none focus:border-white transition-colors"
                                  />
                                  <p className="text-[11px] text-gray-400 mt-1">Usa el formato: MMAA</p>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-bold">Código de seguridad (CVV) *</label>
                                    <Info size={12} className="text-gray-400" />
                                  </div>
                                  <input 
                                    type="password" 
                                    required
                                    maxLength={4}
                                    value={cardCvv}
                                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-[#18181b] border border-[#444] rounded-md py-2.5 px-3 text-white focus:outline-none focus:border-white transition-colors"
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {/* CAMPOS SEGÚN PESTAÑA: RETIRO */}
                          {activeTab === "retirar" && (
                            <>
                              <div>
                                <label className="block text-sm font-bold mb-1">Nombre completo del titular de la cuenta *</label>
                                <input 
                                  type="text" 
                                  required
                                  value={withdrawName}
                                  onChange={(e) => setWithdrawName(e.target.value)}
                                  placeholder="Como aparece en tu identificación oficial"
                                  className="w-full bg-[#18181b] border border-[#444] rounded-md py-2.5 px-3 text-white focus:outline-none focus:border-white transition-colors"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-bold mb-1">
                                  {method.id === "crypto_retiro" ? "Dirección de Billetera (USDT/BTC) *" : "CLABE Interbancaria o Número de tarjeta (16-18 dígitos) *"}
                                </label>
                                <input 
                                  type="text" 
                                  required
                                  value={withdrawClabe}
                                  onChange={(e) => setWithdrawClabe(e.target.value)}
                                  placeholder={method.id === "crypto_retiro" ? "0x... o bc1q..." : "18 dígitos para CLABE o 16 para tarjeta"}
                                  className="w-full bg-[#18181b] border border-[#444] rounded-md py-2.5 px-3 text-white focus:outline-none focus:border-white transition-colors font-mono tracking-wider"
                                />
                              </div>

                              {method.id !== "crypto_retiro" && (
                                <div>
                                  <label className="block text-sm font-bold mb-1">Banco emisor de la cuenta *</label>
                                  <input 
                                    type="text" 
                                    required
                                    value={withdrawBank}
                                    onChange={(e) => setWithdrawBank(e.target.value)}
                                    placeholder="Ej. BBVA, Banorte, Nu, Santander..."
                                    className="w-full bg-[#18181b] border border-[#444] rounded-md py-2.5 px-3 text-white focus:outline-none focus:border-white transition-colors"
                                  />
                                </div>
                              )}
                            </>
                          )}

                          {/* OTROS MÉTODOS DE DEPÓSITO (SPEI / CRYPTO) */}
                          {activeTab === "depositar" && method.id !== "credito" && method.id !== "debito" && (
                            <div className="p-4 bg-[#18181b] border border-[#444] rounded-md text-sm text-gray-400 text-center">
                              Al hacer clic en &quot;Pagar ahora&quot;, se generarán las instrucciones y la referencia bancaria para completar tu pago por {method.name}.
                            </div>
                          )}

                          {/* Texto Legal Dinámico */}
                          <div className="pt-2 text-[10px] leading-relaxed text-gray-400">
                            {activeTab === "depositar" ? (
                              <>Al seleccionar &quot;Pagar ahora&quot;, usted confirma que es el titular de la cuenta y acepta que los fondos se procesarán de acuerdo con nuestros Términos y Condiciones. El monto de su transacción será actualizado en su saldo de Royal Casino tras la confirmación bancaria. Las transacciones son encriptadas mediante seguridad SSL de 256 bits para su total protección. No habrá devoluciones ni créditos por depósitos jugados.</>
                            ) : (
                              <>Al seleccionar &quot;Retirar ahora&quot;, usted certifica que la cuenta bancaria o billetera proporcionada le pertenece de forma personal. Los retiros a cuentas de terceros no están permitidos por regulaciones de prevención de lavado de dinero. Las solicitudes de retiro son revisadas por el equipo de cumplimiento y procesadas en un lapso de 1 a 24 horas hábiles.</>
                            )}
                          </div>

                          {/* Botón de Submit Dinámico */}
                          <button 
                            type="submit"
                            disabled={isProcessing || !amount}
                            className="mt-4 bg-[#e0e0e0] hover:bg-white text-black font-bold py-3 px-6 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isProcessing ? (
                              <><Loader2 className="animate-spin" size={16} /> Procesando...</>
                            ) : (
                              activeTab === "depositar" ? "Pagar ahora" : "Retirar ahora"
                            )}
                          </button>

                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
}