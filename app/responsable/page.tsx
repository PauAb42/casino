"use client";

import { 
  ShieldAlert, Wallet, Clock, 
  Lock, CheckCircle, Bell, GlassWater, 
  UserX, Heart, MessageSquareX, Smile, 
  HelpCircle, ChevronRight, Mail, Phone, FileText
} from "lucide-react";

const quickInfoCards = [
  { icon: Wallet, title: "LÍMITE DE DEPÓSITO", value: "€500,00 / día", info: "Editado 24/05/2024", hasArrow: true, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { icon: Clock, title: "TIEMPO DE SESIÓN", value: "01h 25m / día", info: "Límite: 02h 00m", hasArrow: true, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { icon: Lock, title: "AUTOEXCLUSIÓN", status: "No activa", info: "Puedes activarla cuando lo necesites", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { icon: CheckCircle, title: "ESTADO DE RIESGO", status: "Bajo", info: "¡Bien hecho! Mantén tus hábitos de juego seguros.", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
];

const toolsList = [
  { icon: Wallet, label: "Límite de depósito", value: "€500,00 / día", desc: "Establece cuánto dinero puedes depositar por día, semana o mes.", action: "Editar límite", color: "text-purple-400" },
  { icon: Bell, label: "Recordatorio de realidad", value: "Cada 60 min", desc: "Recibe un recordatorio para mantenerte consciente del tiempo transcurrido.", action: "Editar", color: "text-blue-400" },
  { icon: Clock, label: "Recordatorio de tiempo de sesión", value: "120 min", desc: "Te avisamos cuando alcances el tiempo que establezcas.", action: "Editar", color: "text-cyan-400" },
  { icon: GlassWater, label: "Período de enfriamiento", value: "No activo", desc: "Tómate un descanso temporal del juego.", action: "Activar", color: "text-amber-400" },
  { icon: UserX, label: "Autoexclusión", value: "No activa", desc: "Bloquea tu cuenta de forma temporal o permanente.", action: "Activar", color: "text-red-400" },
];

const consejos = [
  { icon: Smile, title: "Juega por diversión", desc: "El juego debe ser una forma de entretenimiento, no una forma de ganar dinero." },
  { icon: MessageSquareX, title: "No persigas pérdidas", desc: "Tratar de recuperar lo perdido puede llevar a pérdidas aún mayores." },
  { icon: CheckCircle, title: "Establece límites", desc: "Define límites de depósito y tiempo, y respétalos siempre." },
  { icon: Heart, title: "Busca ayuda si lo necesitas", desc: "Pedir ayuda es un signo de fuerza. Estamos aquí para apoyarte." },
];

const stats = [
  { icon: Wallet, label: "Depósito", value: "€120,00", limit: "Límite diario: €500,00", progress: 24, color: "bg-purple-600" },
  { icon: Clock, label: "Tiempo jugado", value: "01h 25m", limit: "Límite diario: 02h 00m", progress: 71, color: "bg-blue-600" },
  { icon: Bell, label: "Próximo recordatorio", value: "En 35 min", desc: "Recordatorio de realidad", color: "text-cyan-400", isText: true },
];

const helpCenter = [
  { icon: HelpCircle, label: "Chat en vivo", status: "Disponible 24/7", statusColor: "text-green-400", hasArrow: true },
  { icon: Mail, label: "Correo electrónico", value: "soporte@royalcasino.com", hasArrow: true },
  { icon: Phone, label: "Línea de ayuda", value: "+34 900 123 456", hasArrow: true },
];

export default function JuegoResponsableStaticPage() {
  return (
    <div className="min-h-screen bg-[#0A0D14] text-white font-sans py-8 px-4 lg:px-8 selection:bg-purple-500/30">
      
      <div className="max-w-[1200px] mx-auto">
        
        {/* Header Section */}
        <header className="relative w-full mb-6 flex flex-col md:flex-row items-center justify-between pb-6 border-b border-white/5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(138,43,226,0.1),transparent_50%)] pointer-events-none" />
          <div className="relative z-10 text-center md:text-left flex-1 max-w-xl">
            <h1 className="text-3xl font-black leading-tight mb-2 text-white tracking-tight">Juego Responsable</h1>
            <p className="text-gray-400 text-xs leading-relaxed">
              Tu bienestar es nuestra prioridad. Utiliza nuestras herramientas para mantener el control y disfrutar del juego de forma segura.
            </p>
          </div>
          <div className="relative w-16 h-16 mt-4 md:mt-0 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-[#8A2BE2] opacity-20 blur-[20px] rounded-full pointer-events-none"></div>
            <ShieldAlert size={36} className="text-[#A78BFA] opacity-90 drop-shadow-[0_0_10px_#8A2BE2]" />
          </div>
        </header>

        {/* Row 1: Quick Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {quickInfoCards.map((card, index) => (
            <div key={index} className="bg-[#121421] border border-white/5 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${card.bg} ${card.border} ${card.color} shrink-0`}>
                  <card.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-gray-500 mb-0.5 truncate">{card.title}</p>
                  {card.value && <p className="text-sm font-bold text-white truncate">{card.value}</p>}
                  {card.status && <p className={`text-sm font-bold ${card.color}`}>{card.status}</p>}
                </div>
                {card.hasArrow && <ChevronRight size={16} className="text-gray-600 ml-auto shrink-0" />}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <p className="text-[10px] text-gray-500 truncate">{card.info}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Tools and Advice */}
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Tools List */}
            <div className="bg-[#121421] border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl">
              <h2 className="text-[11px] font-bold mb-1 text-gray-400 uppercase tracking-widest">Herramientas de Juego Responsable</h2>
              <p className="text-xs text-gray-500 mb-4 max-w-xl">Configura herramientas para ayudarte a mantener el control.</p>
              
              <div className="flex flex-col">
                {toolsList.map((tool, index) => (
                  <div key={index} className="py-3 flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 last:border-0 gap-3 group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#1C1A3A]/50 flex items-center justify-center shrink-0 text-gray-400 group-hover:bg-[#1C1A3A] transition-colors">
                        <tool.icon size={14} className={tool.color} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-200 text-xs mb-0.5">{tool.label}</h4>
                        <p className="text-[11px] text-gray-500 truncate max-w-md">{tool.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                      <span className="text-xs text-white font-medium pl-11 md:pl-0">{tool.value}</span>
                      <div className="border border-white/10 rounded-md py-1.5 px-4 text-[10px] uppercase font-bold text-gray-400 bg-white/5 whitespace-nowrap cursor-default">
                        {tool.action}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Advice Section */}
            <div className="bg-gradient-to-br from-[#1A142A] to-[#121421] border border-purple-500/10 rounded-2xl p-5 md:p-6 shadow-xl">
              <h2 className="text-[11px] font-bold mb-5 text-purple-400/80 uppercase tracking-widest">Consejos para jugar de forma responsable</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {consejos.map((consejo, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                      <consejo.icon size={14} className="text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-200 text-xs mb-1">{consejo.title}</h4>
                      <p className="text-[10px] text-gray-500 leading-relaxed pr-2">{consejo.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Stats and Help */}
          <div className="w-full lg:w-[320px] flex flex-col gap-6">
            
            {/* Today's Stats */}
            <div className="bg-[#121421] border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-5">Estadísticas de Hoy</h3>
              <div className="space-y-5 flex-1">
                {stats.map((stat, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <stat.icon size={14} className="text-gray-500" />
                        <span className="text-xs text-gray-400">{stat.label}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{stat.value}</span>
                    </div>
                    
                    {!stat.isText ? (
                      <>
                        <div className="w-full bg-[#080A14] rounded-full h-1 mb-1.5 shadow-inner">
                          <div className={`${stat.color} h-1 rounded-full`} style={{width: `${stat.progress}%`}}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{stat.limit}</p>
                          <p className="text-[9px] text-gray-500 font-bold">{stat.progress}%</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest text-right">{stat.desc}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Help Center */}
            <div className="bg-[#121421] border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Centro de Ayuda</h3>
              <p className="text-[10px] text-gray-500 mb-5">Estamos aquí para ayudarte.</p>
              
              <div className="space-y-4 flex-1">
                {helpCenter.map((item, index) => (
                  <div key={index} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-3 text-gray-400 transition-colors">
                      <item.icon size={14} />
                      <span className="text-xs">{item.label}</span>
                    </div>
                    {item.status && <span className={`text-[10px] font-bold uppercase tracking-wider ${item.statusColor}`}>{item.status}</span>}
                    {item.value && <span className="text-[10px] text-gray-300 break-all">{item.value}</span>}
                    {item.hasArrow && <ChevronRight size={14} className="text-gray-700 ml-auto" />}
                  </div>
                ))}
              </div>

              {/* Purple Test Box */}
              <div className="bg-[#211145] border border-[#8A2BE2]/40 rounded-xl p-4 mt-6 flex items-center justify-between shadow-[0_0_15px_rgba(138,43,226,0.15)] cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#8A2BE2]/20 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-[#D8B4FE]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs mb-0.5">Test de autoevaluación</h4>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">Evalúa tus hábitos de juego</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#D8B4FE]" />
              </div>
            </div>

          </div>
        </div>

        {/* Footer text */}
        <footer className="mt-12 pt-6 border-t border-white/5 text-center flex flex-col gap-2 text-sm text-gray-500">
          <p className="text-xs font-bold text-gray-400">El juego debe ser divertido. Juega con responsabilidad.</p>
          <p className="text-[10px] leading-relaxed max-w-3xl mx-auto opacity-70">
            Si sientes que el juego se está convirtiendo en un problema, busca ayuda. Información adicional en <code className="text-[#A78BFA] bg-[#1C1A3A] px-1.5 py-0.5 rounded font-sans">jugar bien es</code>.
          </p>
        </footer>

      </div>
    </div>
  );
}