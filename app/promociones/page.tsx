"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Gift, Crown, Sparkles, Clock, 
  Calendar, ShieldCheck, Info, X, 
  ChevronRight, Gem, Zap, Coins
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useNotificationStore } from "@/lib/notificationStore";

// Componente icono para el cashback
function RotateCcwIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
    </svg>
  );
}

const PROMOTIONS = [
  {
    id: "welcome",
    title: "Bono de Bienvenida VIP",
    description: "Duplica tu primer depósito hasta $10,000 MXN y recibe 50 giros gratis en Royal Slots.",
    tag: "NUEVO",
    tagColor: "bg-green-600 text-white",
    icon: Gift,
    color: "text-[#D4AF37]",
    bgLine: "bg-gradient-to-r from-[#D4AF37] to-[#F3D55B]",
    validUntil: "Sin fecha de expiración",
    terms: "Depósito mínimo de $500 MXN. Requisito de apuesta (Rollover) de 35x antes de poder retirar las ganancias. Los giros gratis son válidos por 7 días."
  },
  {
    id: "cashback",
    title: "Cashback Semanal 15%",
    description: "Juega sin preocupaciones. Te devolvemos el 15% de tus pérdidas netas todos los lunes.",
    tag: "SEMANAL",
    tagColor: "bg-blue-600 text-white",
    icon: RotateCcwIcon, 
    color: "text-blue-400",
    bgLine: "bg-gradient-to-r from-blue-500 to-blue-300",
    validUntil: "Todos los lunes a las 00:00 CST",
    terms: "El reembolso máximo semanal es de $20,000 MXN. El cashback se acredita como dinero real sin requisitos de apuesta."
  },
  {
    id: "weekend",
    title: "Recarga de Fin de Semana",
    description: "Recibe un 50% extra en todos tus depósitos realizados de viernes a domingo.",
    tag: "TIEMPO LIMITADO",
    tagColor: "bg-red-600 text-white",
    icon: Calendar,
    color: "text-red-400",
    bgLine: "bg-gradient-to-r from-red-500 to-red-300",
    validUntil: "Fines de semana",
    terms: "Bono máximo de $5,000 MXN por depósito. Requiere activación previa en el Cajero. Rollover de 25x."
  },
  {
    id: "tournament",
    title: "Torneo Rey de Oro",
    description: "Participa en nuestra mesa de Rasca y Gana y compite por una bolsa de $500,000 MXN.",
    tag: "TORNEO",
    tagColor: "bg-[#8A2BE2] text-white",
    icon: Crown,
    color: "text-[#8A2BE2]",
    bgLine: "bg-gradient-to-r from-[#8A2BE2] to-[#c492ff]",
    validUntil: "Termina en 3 días",
    terms: "Por cada $100 MXN apostados en 'Rey de Oro' acumulas 1 punto. Los 50 jugadores con más puntos compartirán la bolsa garantizada."
  },
  {
    id: "freespins",
    title: "Martes de Giros Locos",
    description: "Obtén hasta 100 giros gratis cada martes depositando un mínimo de $300 MXN.",
    tag: "SEMANAL",
    tagColor: "bg-pink-600 text-white",
    icon: Sparkles,
    color: "text-pink-400",
    bgLine: "bg-gradient-to-r from-pink-500 to-pink-300",
    validUntil: "Todos los martes",
    terms: "Aplica solo en tragamonedas seleccionadas (Royal Slots, Mega 777). Requisito de apuesta de 20x en las ganancias de los giros. Vigencia de 24 horas tras activación."
  },
  {
    id: "crypto",
    title: "Bono Crypto 200%",
    description: "Deposita usando tus criptomonedas favoritas y recibe un bono masivo del 200% extra.",
    tag: "EXCLUSIVO",
    tagColor: "bg-orange-600 text-white",
    icon: Coins,
    color: "text-orange-400",
    bgLine: "bg-gradient-to-r from-orange-500 to-orange-300",
    validUntil: "Promoción permanente",
    terms: "Aplica únicamente para depósitos realizados con criptomonedas (BTC, ETH, USDT). Depósito mínimo equivalente a $1,000 MXN. Rollover de 40x."
  }
];

export default function PromocionesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [claimedPromos, setClaimedPromos] = useState<string[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<typeof PROMOTIONS[0] | null>(null);

  // Funcionalidad para Reclamar Promociones
  const handleClaim = (promo: typeof PROMOTIONS[0]) => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (claimedPromos.includes(promo.id)) return;

    setClaimedPromos([...claimedPromos, promo.id]);
    
    // Dispara la notificación al Navbar global
    addNotification(`Has activado con éxito: ${promo.title}. Revisa tu saldo o cajero para usarlo.`);
    
    // Notificación nativa del SO opcional
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Promoción Activada", {
        body: `Tu bono "${promo.title}" ya está activo. ¡Buena suerte!`,
        icon: "/fondo.png"
      });
    }
  };

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
                onClick={() => handleClaim(PROMOTIONS[0])}
                disabled={claimedPromos.includes(PROMOTIONS[0].id)}
                className="bg-gradient-to-r from-[#D4AF37] to-[#F3D55B] hover:from-[#F3D55B] hover:to-[#FFF1A0] text-black font-black py-3.5 px-8 rounded-xl transition-all shadow-[0_5px_20px_rgba(212,175,55,0.3)] tracking-widest uppercase text-sm disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                {claimedPromos.includes(PROMOTIONS[0].id) ? "BONO ACTIVADO" : "RECLAMAR AHORA"}
              </button>
              <button 
                onClick={() => setSelectedTerms(PROMOTIONS[0])}
                className="bg-[#131722] border border-white/10 hover:bg-white/5 text-white font-bold py-3.5 px-6 rounded-xl transition-all tracking-widest uppercase text-sm"
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

        {/* El grid ahora se llenará perfectamente con los 6 elementos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROMOTIONS.map((promo) => {
            const isClaimed = claimedPromos.includes(promo.id);
            const PromoIcon = promo.icon;

            return (
              <div key={promo.id} className="bg-[#0B0E14] border border-white/5 hover:border-white/20 rounded-2xl overflow-hidden shadow-lg transition-all hover:-translate-y-1 flex flex-col group">
                <div className={`h-1.5 w-full ${promo.bgLine}`}></div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${promo.color}`}>
                      <PromoIcon size={24} />
                    </div>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded tracking-widest ${promo.tagColor}`}>
                      {promo.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mb-2">{promo.title}</h3>
                  <p className="text-gray-400 text-sm mb-6 flex-1 leading-relaxed">
                    {promo.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
                    <Clock size={14} />
                    <span>{promo.validUntil}</span>
                  </div>

                  <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5">
                    <button 
                      onClick={() => handleClaim(promo)}
                      disabled={isClaimed}
                      className={`flex-1 font-bold py-2.5 rounded-lg transition-colors text-xs uppercase tracking-widest ${
                        isClaimed 
                          ? "bg-[#1E1133] text-[#8A2BE2] border border-[#8A2BE2]/30 cursor-not-allowed" 
                          : "bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                      }`}
                    >
                      {isClaimed ? "Activado" : "Reclamar"}
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
                <Info size={16} /> Términos: {selectedTerms.title}
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
                <p className="text-gray-400">{selectedTerms.description}</p>
              </div>
              
              <h4 className="text-white font-bold border-b border-white/10 pb-2">Condiciones Generales</h4>
              <p className="leading-relaxed">
                {selectedTerms.terms}
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