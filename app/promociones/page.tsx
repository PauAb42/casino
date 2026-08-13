"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Gift, Crown, Clock,
  ShieldCheck, Info, X,
  ChevronRight, Gem, Coins, RefreshCw
} from "lucide-react";
import { ApiError, api } from "@/lib/api";
import type { Promocion } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import { useBalanceStore } from "@/lib/balanceStore";
import { useNotificationStore } from "@/lib/notificationStore";

/**
 * La presentación de cada promoción.
 *
 * El catálogo entero —títulos, porcentajes, topes, rollover y términos— viene
 * ahora de `GET /promociones`. Aquí solo queda el vestuario: qué icono y qué
 * color le toca a cada tipo. Antes las seis promociones eran una constante en
 * este archivo, así que la pantalla podía anunciar un bono que el backend no
 * conocía y reclamarlo no acreditaba nada.
 */
const ESTILO_POR_TIPO: Record<string, { icon: React.ElementType; color: string; bgLine: string; tagColor: string }> = {
  bono_deposito: {
    icon: Gift,
    color: "text-[#D4AF37]",
    bgLine: "bg-gradient-to-r from-[#D4AF37] to-[#F3D55B]",
    tagColor: "bg-green-600 text-white",
  },
  cashback: {
    icon: RefreshCw,
    color: "text-blue-400",
    bgLine: "bg-gradient-to-r from-blue-500 to-blue-300",
    tagColor: "bg-blue-600 text-white",
  },
  bono_saldo: {
    icon: Coins,
    color: "text-orange-400",
    bgLine: "bg-gradient-to-r from-orange-500 to-orange-300",
    tagColor: "bg-orange-600 text-white",
  },
  torneo: {
    icon: Crown,
    color: "text-[#8A2BE2]",
    bgLine: "bg-gradient-to-r from-[#8A2BE2] to-[#c492ff]",
    tagColor: "bg-[#8A2BE2] text-white",
  },
};

const estiloDe = (tipo: string) => ESTILO_POR_TIPO[tipo] ?? ESTILO_POR_TIPO.bono_saldo;

const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

/**
 * Lo que de verdad pasó al reclamar, en una frase.
 *
 * Un bono de depósito **no acredita nada** al reclamarlo: queda pendiente hasta
 * que haya un depósito que lo active. Decirlo es la diferencia entre informar y
 * confirmar algo que no ocurrió.
 */
function estadoDelReclamo(promo: Promocion): string | null {
  if (!promo.reclamo) return null;

  switch (promo.reclamo.estado) {
    case "pendiente":
      return `Activo y esperando tu próximo depósito de al menos ${currency.format(promo.deposito_minimo.mxn)}. Todavía no se acreditó nada.`;
    case "activo":
      return `Bono de ${currency.format(promo.reclamo.monto_bono_mxn)} acreditado. Te faltan ${currency.format(promo.reclamo.rollover_pendiente_mxn)} de apuesta para poder retirarlo.`;
    case "cumplido":
      return promo.reclamo.monto_bono_mxn > 0
        ? `Acreditado: ${currency.format(promo.reclamo.monto_bono_mxn)}, sin requisitos pendientes.`
        : "Reclamado.";
    default:
      return "Esta promoción expiró.";
  }
}

export default function PromocionesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const aplicarBilletera = useBalanceStore((s) => s.aplicarBilletera);

  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reclamando, setReclamando] = useState<string | null>(null);
  const [selectedTerms, setSelectedTerms] = useState<Promocion | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { promociones: filas } = await api.promociones.listar();
      setPromociones(filas);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar las promociones");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void cargar();
  }, [user, cargar]);

  /**
   * Reclamar.
   *
   * La respuesta del backend trae un `mensaje` que describe lo que **realmente**
   * ocurrió, y es ese el que se muestra. La versión anterior añadía el id a un
   * `useState`, decía "revisa tu saldo o cajero para usarlo" y no tocaba ni una
   * fila: el saldo no cambiaba y el reclamo desaparecía al refrescar.
   */
  const handleClaim = async (promo: Promocion) => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (promo.reclamo || reclamando) return;

    setReclamando(promo.id);
    setError(null);

    try {
      const respuesta = await api.promociones.reclamar(promo.id);

      // Si acreditó saldo, la billetera vuelve ya actualizada.
      if (respuesta.billetera) aplicarBilletera(respuesta.billetera);

      addNotification(respuesta.mensaje);

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(promo.titulo, { body: respuesta.mensaje, icon: "/fondo.png" });
      }

      await cargar();
    } catch (err) {
      // El 422 del cashback sin pérdidas llega aquí con su explicación escrita.
      setError(err instanceof ApiError ? err.message : "No se pudo reclamar la promoción");
    } finally {
      setReclamando(null);
    }
  };

  const destacada = promociones[0] ?? null;

  return (
    <div className="min-h-screen bg-[#05050A] text-white font-sans pb-20">
      
      {/* HEADER HERO (Banner Principal) */}
      <section className="relative w-full bg-[#0B0E14] border-b border-white/5 pt-12 pb-16 px-6 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.15),transparent_50%)]" />
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <Gift size={300} className="text-[#D4AF37]" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight tracking-tight">
              Bono de Bienvenida <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFF1A0] via-[#D4AF37] to-[#8a551e]">
                100% hasta $10,000
              </span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-8">
              Inicia tu aventura en Royal Casino con el pie derecho. Duplicamos tu primer depósito y te regalamos 50 giros gratis para la tragamonedas Royal Slots.
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => destacada && void handleClaim(destacada)}
                disabled={!destacada || Boolean(destacada.reclamo) || reclamando === destacada?.id}
                className="bg-gradient-to-r from-[#D4AF37] to-[#F3D55B] hover:from-[#F3D55B] hover:to-[#FFF1A0] text-black font-black py-3.5 px-8 rounded-xl transition-all shadow-[0_5px_20px_rgba(212,175,55,0.3)] tracking-widest uppercase text-sm disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                {destacada?.reclamo ? "BONO ACTIVADO" : reclamando === destacada?.id ? "RECLAMANDO…" : "RECLAMAR AHORA"}
              </button>
              <button
                onClick={() => destacada && setSelectedTerms(destacada)}
                disabled={!destacada}
                className="bg-[#131722] border border-white/10 hover:bg-white/5 text-white font-bold py-3.5 px-6 rounded-xl transition-all tracking-widest uppercase text-sm disabled:opacity-40"
              >
                Términos
              </button>
            </div>
          </div>
          
          {/* Tarjeta Visual Decorativa (AHORA MÁS GRANDE E IMPONENTE) */}
          <div className="hidden lg:flex relative w-96 h-60 xl:w-[460px] xl:h-[280px] bg-gradient-to-br from-[#1E1133] to-[#0B0E14] rounded-3xl border border-[#8A2BE2]/40 shadow-[0_0_50px_rgba(138,43,226,0.3)] transform rotate-2 hover:rotate-0 transition-transform duration-500 shrink-0">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            <div className="absolute top-6 right-6 bg-[#8A2BE2] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded shadow-lg">VIP PASS</div>
            <div className="p-8 flex flex-col justify-end h-full">
              <Crown size={48} className="text-[#D4AF37] mb-3 drop-shadow-lg" />
              <p className="text-3xl font-black text-white tracking-widest drop-shadow-md">ROYAL CASINO</p>
              <p className="text-xs text-gray-400 font-mono tracking-widest mt-1">MEMBER 2354887</p>
            </div>
          </div>
        </div>
      </section>

      {/* GRID DE PROMOCIONES */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 mt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-wide flex items-center gap-3">
            Promociones Activas
          </h2>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="flex items-center justify-center py-20 text-gray-500 gap-3">
            <RefreshCw size={20} className="animate-spin text-[#8A2BE2]" />
            <span className="text-sm">Cargando promociones…</span>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promociones.map((promo) => {
            const estilo = estiloDe(promo.tipo);
            const PromoIcon = estilo.icon;
            const isClaimed = Boolean(promo.reclamo);
            const detalle = estadoDelReclamo(promo);

            return (
              <div key={promo.id} className="bg-[#0B0E14] border border-white/5 hover:border-white/20 rounded-2xl overflow-hidden shadow-lg transition-all hover:-translate-y-1 flex flex-col group">
                <div className={`h-1.5 w-full ${estilo.bgLine}`}></div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${estilo.color}`}>
                      <PromoIcon size={24} />
                    </div>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded tracking-widest ${estilo.tagColor}`}>
                      {promo.etiqueta}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mb-2">{promo.titulo}</h3>
                  <p className="text-gray-400 text-sm mb-4 flex-1 leading-relaxed">
                    {promo.descripcion}
                  </p>

                  {/* El rollover se anuncia en la tarjeta, no escondido en los
                      términos: es lo que decide si el bono se puede retirar. */}
                  {promo.rollover_multiplicador > 0 && (
                    <p className="text-[11px] text-amber-300/80 mb-4 border border-amber-500/20 bg-amber-950/20 rounded px-2 py-1.5">
                      Requisito de apuesta: {promo.rollover_multiplicador}x sobre el bono antes de poder retirar.
                    </p>
                  )}

                  {detalle && (
                    <p className="text-[11px] text-[#8A2BE2] mb-4 leading-relaxed">{detalle}</p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
                    <Clock size={14} />
                    <span>{promo.vigencia_texto}</span>
                  </div>

                  <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5">
                    <button
                      onClick={() => void handleClaim(promo)}
                      disabled={isClaimed || reclamando === promo.id || !promo.vigente}
                      className={`flex-1 font-bold py-2.5 rounded-lg transition-colors text-xs uppercase tracking-widest ${
                        isClaimed
                          ? "bg-[#1E1133] text-[#8A2BE2] border border-[#8A2BE2]/30 cursor-not-allowed"
                          : "bg-white/5 border border-white/10 hover:bg-white/10 text-white disabled:opacity-40"
                      }`}
                    >
                      {isClaimed
                        ? promo.reclamo?.estado === "pendiente" ? "Pendiente" : "Activado"
                        : reclamando === promo.id ? "Reclamando…"
                        : promo.tipo === "torneo" ? "Ver torneo" : "Reclamar"}
                    </button>
                    <button
                      onClick={() => setSelectedTerms(promo)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="Ver términos"
                    >
                      <Info size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* SECCIÓN CLUB VIP TEASER */}
        <section className="mt-20 bg-gradient-to-r from-[#1A1A24] to-[#0B0E14] border border-[#D4AF37]/20 rounded-3xl p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_10px_40px_rgba(212,175,55,0.05)] relative overflow-hidden">
          <div className="absolute -left-10 -bottom-10 opacity-5 pointer-events-none">
            <Gem size={250} />
          </div>
          
          <div className="relative z-10 max-w-xl">
            <h3 className="text-2xl font-bold mb-2 text-[#D4AF37]">Royal VIP Club</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Sube de nivel mientras juegas. Los miembros de nuestro club VIP disfrutan de gestores de cuenta personales, límites de retiro más altos, bonos de cumpleaños y eventos exclusivos en vivo.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-400">
              <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-green-400"/> Retiros Prioritarios</span>
              <span className="flex items-center gap-1"><Gift size={14} className="text-blue-400"/> Regalos Exclusivos</span>
              <span className="flex items-center gap-1"><Crown size={14} className="text-[#D4AF37]"/> Gestor VIP</span>
            </div>
          </div>

          <div className="relative z-10 w-full md:w-auto">
            <button className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#F3D55B] text-black font-black py-4 px-8 rounded-xl transition-all shadow-[0_5px_15px_rgba(212,175,55,0.2)] tracking-widest uppercase text-sm">
              Saber más <ChevronRight size={16} />
            </button>
          </div>
        </section>
      </main>

      {/* MODAL DE TÉRMINOS Y CONDICIONES (Pestaña flotante) */}
      {selectedTerms && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl w-full max-w-xl flex flex-col max-h-[80vh] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#131722] rounded-t-2xl">
              <h2 className="text-sm font-bold text-[#D4AF37] flex items-center gap-2 tracking-widest uppercase">
                <Info size={16} /> Términos: {selectedTerms.titulo}
              </h2>
              <button 
                onClick={() => setSelectedTerms(null)} 
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto text-sm text-gray-300 space-y-4 custom-scrollbar">
              <div className="bg-[#1A1A24] p-4 rounded-lg border border-white/5 mb-4">
                <p className="text-white font-bold mb-1">Descripción del Bono</p>
                <p className="text-gray-400">{selectedTerms.descripcion}</p>
              </div>
              
              <h4 className="text-white font-bold border-b border-white/10 pb-2">Condiciones Generales</h4>
              <p className="leading-relaxed">
                {selectedTerms.terminos}
              </p>
              
              <ul className="list-disc pl-5 space-y-2 text-gray-400 mt-4">
                <li>Esta promoción es válida únicamente para usuarios registrados y verificados mayores de 18 años.</li>
                <li>Royal Casino se reserva el derecho de cancelar o modificar esta promoción en cualquier momento sin previo aviso.</li>
                <li>El abuso de promociones (creación de cuentas múltiples) resultará en el cierre inmediato de la cuenta y la confiscación de fondos.</li>
                <li>Aplican los <a href="#" className="text-[#8A2BE2] hover:underline">Términos y Condiciones Generales</a> de Royal Casino.</li>
              </ul>
            </div>
            
            <div className="p-4 border-t border-white/10 flex justify-end bg-[#131722] rounded-b-2xl">
              <button 
                onClick={() => setSelectedTerms(null)} 
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-6 rounded-lg transition-colors text-xs tracking-widest uppercase"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}