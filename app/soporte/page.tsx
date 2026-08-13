"use client";

import { useState } from "react";
import { 
  HeadphonesIcon, MessageSquare, Mail, Phone, 
  ChevronDown, FileText, CheckCircle, 
  Loader2, Send
} from "lucide-react";
import { useSesionRequerida } from "@/lib/useSesionRequerida";
import { useNotificationStore } from "@/lib/notificationStore";

const FAQS = [
  {
    id: "faq-1",
    question: "¿Cuánto tiempo tarda en procesarse un retiro?",
    answer: "Los retiros se procesan según el método elegido. Las transferencias SPEI y criptomonedas suelen procesarse en un lapso de 1 a 24 horas hábiles. Asegúrate de tener tu cuenta verificada (KYC) para evitar demoras."
  },
  {
    id: "faq-2",
    question: "¿Cómo funciona el bono de bienvenida?",
    answer: "El bono de bienvenida duplica tu primer depósito hasta $10,000 MXN. Para poder retirar las ganancias generadas con el bono, debes cumplir con un requisito de apuesta (Rollover) de 35x el valor del bono."
  },
  {
    id: "faq-3",
    question: "¿Es seguro depositar con mi tarjeta de crédito?",
    answer: "Totalmente. Royal Casino utiliza tecnología de encriptación SSL de 256 bits (el mismo estándar que usan los bancos a nivel mundial) para garantizar que tus datos financieros estén siempre protegidos."
  },
  {
    id: "faq-4",
    question: "¿Qué hago si olvidé mi contraseña?",
    answer: "Ve a la sección 'Mi Cuenta', selecciona la pestaña 'Seguridad' y haz clic en 'Cambiar Contraseña'. Si no puedes iniciar sesión, utiliza el enlace 'Olvidé mi contraseña' en la pantalla de Login."
  },
  {
    id: "faq-5",
    question: "¿Por qué mi depósito aún no aparece en mi saldo?",
    answer: "Algunos métodos de pago como transferencias bancarias o criptomonedas requieren confirmaciones en la red. Si han pasado más de 24 horas y tu depósito no se refleja, por favor contáctanos adjuntando tu comprobante de pago."
  }
];

export default function SoportePage() {
  const { user, resolviendo } = useSesionRequerida();
  const { addNotification } = useNotificationStore();

  const [activeFAQ, setActiveFAQ] = useState<string | null>("faq-1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    asunto: "",
    mensaje: ""
  });

  const toggleFAQ = (id: string) => {
    setActiveFAQ(activeFAQ === id ? null : id);
  };

  const handleSimulateChat = () => {
    addNotification("Conectando con un agente en vivo... Por favor espera.");
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.asunto || !formData.mensaje) return;

    setIsSubmitting(true);

    // Simulamos el envío del formulario al servidor
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      addNotification("Tu solicitud ha sido enviada a nuestro equipo de soporte. Te responderemos pronto.");
      setFormData({ asunto: "", mensaje: "" });

      // Restaurar el formulario después de 5 segundos
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 2000);
  };

  if (resolviendo || !user) return <div className="min-h-screen bg-[#05050A]" />;

  return (
    <div className="min-h-screen bg-[#05050A] text-white font-sans pb-20">
      
      {/* HEADER HERO DE SOPORTE */}
      <section className="relative w-full bg-[#0B0E14] border-b border-white/5 pt-12 pb-16 px-6 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(138,43,226,0.15),transparent_50%)]" />
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <HeadphonesIcon size={300} className="text-[#8A2BE2]" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight tracking-tight">
            Centro de Ayuda
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl leading-relaxed">
            Estamos aquí para resolver tus dudas y garantizar que tengas la mejor experiencia en Royal Casino. Explora nuestras preguntas frecuentes o contacta a un agente en vivo.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 mt-12">
        
        {/* TARJETAS DE CONTACTO RÁPIDO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Chat en vivo */}
          <div className="bg-[#131722] border border-white/5 hover:border-[#8A2BE2]/50 rounded-2xl p-6 transition-all group flex flex-col items-center text-center shadow-lg">
            <div className="w-16 h-16 bg-[#1E1133] rounded-full flex items-center justify-center mb-4 border border-[#8A2BE2]/30 group-hover:scale-110 transition-transform">
              <MessageSquare size={28} className="text-[#8A2BE2]" />
            </div>
            <h3 className="text-lg font-bold mb-2">Chat en Vivo</h3>
            <p className="text-sm text-gray-400 mb-6 flex-1">Respuesta inmediata. Habla directamente con uno de nuestros agentes de soporte.</p>
            <button onClick={handleSimulateChat} className="w-full bg-[#8A2BE2] hover:bg-[#7220c2] text-white font-bold py-3 px-6 rounded-xl transition-colors text-xs tracking-widest uppercase shadow-[0_0_15px_rgba(138,43,226,0.3)]">
              Iniciar Chat
            </button>
          </div>

          {/* Correo */}
          <div className="bg-[#131722] border border-white/5 hover:border-white/20 rounded-2xl p-6 transition-all group flex flex-col items-center text-center shadow-lg">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10 group-hover:scale-110 transition-transform">
              <Mail size={28} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold mb-2">Correo Electrónico</h3>
            <p className="text-sm text-gray-400 mb-6 flex-1">Para consultas detalladas o envío de documentos para la verificación KYC.</p>
            <a href="mailto:soporte@royalcasino.com" className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 px-6 rounded-xl transition-colors text-xs tracking-widest uppercase block">
              soporte@royalcasino.com
            </a>
          </div>

          {/* Teléfono VIP */}
          <div className="bg-gradient-to-b from-[#1A1100] to-[#131722] border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 rounded-2xl p-6 transition-all group flex flex-col items-center text-center shadow-[0_0_30px_rgba(212,175,55,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-lg">
              Miembros VIP
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-[#8a551e] rounded-full flex items-center justify-center mb-4 border border-[#F3D55B] shadow-[0_0_20px_rgba(212,175,55,0.4)] group-hover:scale-110 transition-transform">
              <Phone size={28} className="text-black" />
            </div>
            <h3 className="text-lg font-bold text-[#D4AF37] mb-2">Línea Exclusiva</h3>
            <p className="text-sm text-gray-400 mb-6 flex-1">Asistencia telefónica prioritaria para nuestros miembros del Club VIP Bronce o superior.</p>
            <button className="w-full bg-transparent border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-bold py-3 px-6 rounded-xl transition-colors text-xs tracking-widest uppercase">
              +52 55 1234 5678
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* SECCIÓN PREGUNTAS FRECUENTES (Acordeón) */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <FileText size={24} className="text-[#8A2BE2]" />
              <h2 className="text-2xl font-bold">Preguntas Frecuentes</h2>
            </div>
            
            <div className="space-y-3">
              {FAQS.map((faq) => {
                const isOpen = activeFAQ === faq.id;
                return (
                  <div key={faq.id} className="bg-[#131722] border border-white/5 rounded-xl overflow-hidden transition-all">
                    <button 
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                    >
                      <span className={`font-bold text-sm md:text-base pr-4 ${isOpen ? "text-[#D4AF37]" : "text-white"}`}>
                        {faq.question}
                      </span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform bg-black/50 ${isOpen ? "rotate-180" : ""}`}>
                        <ChevronDown size={16} className={isOpen ? "text-[#D4AF37]" : "text-gray-400"} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-sm text-gray-400 leading-relaxed bg-[#131722] border-t border-white/5 animate-in fade-in slide-in-from-top-2">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* FORMULARIO DE CONTACTO */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="bg-[#0B0E14] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#8A2BE2] rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
              
              <h2 className="text-xl font-bold mb-2">Envíanos un Mensaje</h2>
              <p className="text-xs text-gray-400 mb-6">Llena el formulario y generaremos un ticket de soporte. Te responderemos a tu correo registrado.</p>

              {isSubmitted ? (
                <div className="bg-[#131722] border border-green-500/30 rounded-xl p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 text-green-400 border border-green-500/20">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-green-400 mb-2">¡Mensaje Enviado!</h3>
                  <p className="text-sm text-gray-400">Hemos recibido tu solicitud. El ticket #TKT-{Math.floor(Math.random() * 9000 + 1000)} ha sido generado.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-4 relative z-10">
                  
                  {/* Info bloqueada del usuario logueado */}
                  <div className="bg-[#131722] border border-white/5 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1E1133] border border-[#8A2BE2]/30 flex items-center justify-center text-[#8A2BE2] font-bold uppercase">
                      {user?.participante?.alias?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">{user?.participante?.alias || "Jugador"}</p>
                      <p className="text-[10px] text-gray-500">ID de cuenta conectado</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Asunto</label>
                    <div className="relative">
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <select 
                        required
                        value={formData.asunto}
                        onChange={(e) => setFormData({...formData, asunto: e.target.value})}
                        className="w-full bg-[#131722] border border-white/10 rounded-xl py-3 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-[#8A2BE2] transition-colors appearance-none"
                      >
                        <option value="" disabled>Selecciona una opción</option>
                        <option value="deposito">Problema con un Depósito</option>
                        <option value="retiro">Problema con un Retiro</option>
                        <option value="juego">Error en un Juego</option>
                        <option value="kyc">Verificación de Cuenta (KYC)</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Mensaje</label>
                    <textarea 
                      required
                      value={formData.mensaje}
                      onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
                      placeholder="Describe tu problema con detalle para que podamos ayudarte mejor..."
                      className="w-full bg-[#131722] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#8A2BE2] transition-colors resize-none h-32 custom-scrollbar"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting || !formData.asunto || !formData.mensaje}
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F3D55B] hover:from-[#F3D55B] hover:to-[#FFF1A0] text-black font-black py-4 rounded-xl transition-all shadow-[0_5px_20px_rgba(212,175,55,0.2)] tracking-widest uppercase text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                  >
                    {isSubmitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                    ) : (
                      <><Send size={16} /> Enviar Ticket</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}