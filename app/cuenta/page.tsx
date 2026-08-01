"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Shield, Bell, CreditCard, 
  Mail, Phone, Lock, Edit2, Check, 
  Crown, History, AlertCircle, Save,
  Smartphone, Gamepad2, X, ArrowRight
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useBalanceStore } from "@/lib/balanceStore";
import { useNotificationStore } from "@/lib/notificationStore";

const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 });

export default function CuentaPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance } = useBalanceStore();
  const { addNotification } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<"perfil" | "seguridad" | "preferencias">("perfil");
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados para simular el formulario de datos
  const [formData, setFormData] = useState({
    nombre: "",
    alias: "",
    email: "usuario@ejemplo.com",
    telefono: "+52 55 1234 5678"
  });

  // Estados para el Modal de Cambiar Contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [emailForReset, setEmailForReset] = useState("");
  const [resetStatus, setResetStatus] = useState<"idle" | "success">("idle");

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else {
      setFormData({
        nombre: user.participante?.nombre || "Jugador",
        alias: user.participante?.alias || "JugadorUno",
        email: "usuario@ejemplo.com", // Simulado
        telefono: "+52 55 1234 5678" // Simulado
      });
    }
  }, [user, router]);

  const handleSaveProfile = () => {
    setIsEditing(false);
    addNotification("¡Tu perfil ha sido actualizado exitosamente!");
  };

  if (!user) return <div className="min-h-screen bg-[#05050A]"></div>;

  return (
    <div className="min-h-screen bg-[#05050A] text-white font-sans pb-20 relative">
      
      {/* HEADER DE LA SECCIÓN */}
      <div className="bg-[#0B0E14] border-b border-white/5 pt-12 pb-16 px-6 lg:px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(138,43,226,0.15),transparent_50%)] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-[#3B2063] to-[#1E1133] flex items-center justify-center border-4 border-[#8A2BE2]/30 text-white font-black text-4xl md:text-5xl uppercase shadow-[0_0_30px_rgba(138,43,226,0.3)]">
              {formData.alias.charAt(0)}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#D4AF37] to-[#F3D55B] w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#0B0E14] shadow-lg">
              <Crown size={20} className="text-black" />
            </div>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl md:text-4xl font-black mb-1">{formData.alias}</h1>
            <p className="text-gray-400 mb-4">{formData.nombre} • Miembro desde 2024</p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="bg-[#131722] border border-white/5 px-4 py-2 rounded-lg flex items-center gap-3 shadow-inner">
                <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                  <CreditCard size={14} className="text-gray-400" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Saldo Real</span>
                  <span className="text-sm font-bold text-white">{currency.format(balance)}</span>
                </div>
              </div>

              <div className="bg-[#131722] border border-[#D4AF37]/30 px-4 py-2 rounded-lg flex items-center gap-3 shadow-inner">
                <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                  <Crown size={14} className="text-[#D4AF37]" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-bold">Nivel VIP</span>
                  <span className="text-sm font-bold text-white">Bronce</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO DEL DASHBOARD */}
      <main className="max-w-6xl mx-auto px-4 lg:px-12 mt-8 flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR DE NAVEGACIÓN */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-[#0B0E14] border border-white/5 rounded-2xl p-2 shadow-xl flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 custom-scrollbar">
            <button 
              onClick={() => setActiveTab("perfil")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-xs lg:text-sm tracking-wide shrink-0 ${activeTab === "perfil" ? "bg-[#1E1133] text-[#8A2BE2]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              <User size={18} /> Información Personal
            </button>
            <button 
              onClick={() => setActiveTab("seguridad")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-xs lg:text-sm tracking-wide shrink-0 ${activeTab === "seguridad" ? "bg-[#1E1133] text-[#8A2BE2]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              <Shield size={18} /> Seguridad
            </button>
            <button 
              onClick={() => setActiveTab("preferencias")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-xs lg:text-sm tracking-wide shrink-0 ${activeTab === "preferencias" ? "bg-[#1E1133] text-[#8A2BE2]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              <Bell size={18} /> Preferencias
            </button>
            
            <div className="h-px bg-white/5 my-2 hidden lg:block"></div>
            
            <button 
              onClick={() => router.push("/historial")}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-xs lg:text-sm tracking-wide text-gray-400 hover:text-white hover:bg-white/5 shrink-0"
            >
              <History size={18} /> Historial de Juego
            </button>
          </div>
        </aside>

        {/* ÁREA DE CONTENIDO */}
        <div className="flex-1 bg-[#0B0E14] border border-white/5 rounded-2xl shadow-xl overflow-hidden min-h-[400px]">
          
          {/* TABS CONTENT */}
          {activeTab === "perfil" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-6 lg:p-8 border-b border-white/5 flex justify-between items-center bg-[#131722]">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Información Personal</h2>
                  <p className="text-xs text-gray-400">Gestiona tus datos personales e información de contacto.</p>
                </div>
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-white/5 border border-white/10 hover:bg-white/10 text-white p-2 md:px-4 md:py-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                  >
                    <Edit2 size={14} /> <span className="hidden md:inline">Editar</span>
                  </button>
                ) : (
                  <button 
                    onClick={handleSaveProfile}
                    className="bg-gradient-to-r from-[#15803d] to-[#166534] hover:from-[#16a34a] hover:to-[#15803d] text-white border border-green-500 p-2 md:px-4 md:py-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(21,128,61,0.3)]"
                  >
                    <Save size={14} /> <span className="hidden md:inline">Guardar</span>
                  </button>
                )}
              </div>
              
              <div className="p-6 lg:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre Completo</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="text" 
                        disabled={!isEditing}
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        className="w-full bg-[#131722] border border-white/10 disabled:border-transparent disabled:opacity-70 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#8A2BE2] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Alias de Juego</label>
                    <div className="relative">
                      <Gamepad2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="text" 
                        disabled={!isEditing}
                        value={formData.alias}
                        onChange={(e) => setFormData({...formData, alias: e.target.value})}
                        className="w-full bg-[#131722] border border-white/10 disabled:border-transparent disabled:opacity-70 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#8A2BE2] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Correo Electrónico</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="email" 
                        disabled
                        value={formData.email}
                        className="w-full bg-[#131722] border-transparent opacity-70 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-[#D4AF37] flex items-center gap-1"><Check size={10} /> Correo verificado</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Teléfono</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="text" 
                        disabled={!isEditing}
                        value={formData.telefono}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                        className="w-full bg-[#131722] border border-white/10 disabled:border-transparent disabled:opacity-70 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#8A2BE2] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "seguridad" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-6 lg:p-8 border-b border-white/5 bg-[#131722]">
                <h2 className="text-xl font-bold text-white mb-1">Seguridad de la Cuenta</h2>
                <p className="text-xs text-gray-400">Protege tu cuenta y tus fondos con nuestras opciones de seguridad.</p>
              </div>
              
              <div className="p-6 lg:p-8 space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border border-white/5 rounded-xl bg-[#131722]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1E1133] flex items-center justify-center border border-[#8A2BE2]/30 text-[#8A2BE2]">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Contraseña</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Última actualización: hace 30 días</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setEmailForReset(formData.email);
                      setResetStatus("idle");
                      setShowPasswordModal(true);
                    }}
                    className="w-full md:w-auto bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-2 px-4 rounded-lg transition-colors text-xs uppercase tracking-widest"
                  >
                    Cambiar
                  </button>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border border-white/5 rounded-xl bg-[#131722]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center border border-gray-700 text-gray-400">
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">Autenticación en 2 Pasos (2FA)</h4>
                        <span className="bg-red-500/20 text-red-400 text-[9px] font-bold px-2 py-0.5 rounded border border-red-500/30 uppercase tracking-widest">Desactivado</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Añade una capa extra de seguridad usando una app autenticadora.</p>
                    </div>
                  </div>
                  <button className="w-full md:w-auto bg-[#8A2BE2] hover:bg-[#7220c2] text-white font-bold py-2 px-4 rounded-lg transition-colors text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(138,43,226,0.3)]">
                    Activar 2FA
                  </button>
                </div>
                
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-900/10 border border-blue-500/20">
                  <AlertCircle size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-300 leading-relaxed">
                    Te recomendamos encarecidamente activar la Autenticación en 2 Pasos (2FA) para proteger tus fondos y retiros.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferencias" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-6 lg:p-8 border-b border-white/5 bg-[#131722]">
                <h2 className="text-xl font-bold text-white mb-1">Preferencias y Notificaciones</h2>
                <p className="text-xs text-gray-400">Controla cómo nos comunicamos contigo.</p>
              </div>
              
              <div className="p-6 lg:p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-white/5 rounded-xl bg-[#131722]">
                    <div>
                      <h4 className="font-bold text-white text-sm">Correos Promocionales</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Recibe ofertas exclusivas, giros gratis y bonos de recarga.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8A2BE2]"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-white/5 rounded-xl bg-[#131722]">
                    <div>
                      <h4 className="font-bold text-white text-sm">Notificaciones SMS</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Alertas importantes sobre tus retiros y seguridad de la cuenta.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8A2BE2]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-white/5 rounded-xl bg-[#131722]">
                    <div>
                      <h4 className="font-bold text-white text-sm">Sonidos del Sistema</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Reproducir sonidos al recibir notificaciones dentro del casino.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8A2BE2]"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL CAMBIAR CONTRASEÑA */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05050A]/80 backdrop-blur-sm p-4">
          <div className="bg-[#0B0E14] border border-[#8A2BE2]/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(138,43,226,0.2)] w-full max-w-md relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 bg-[#1E1133] rounded-full flex items-center justify-center mb-6 border border-[#8A2BE2]/30 shadow-[0_0_30px_rgba(138,43,226,0.3)] mx-auto">
              <Lock className="text-[#D4AF37]" size={28} />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Cambiar Contraseña</h2>

            {resetStatus === "idle" ? (
              <>
                <p className="text-gray-400 text-sm mb-6 text-center leading-relaxed">
                  Confirma tu correo electrónico y te enviaremos un enlace seguro para restablecer tu contraseña.
                </p>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setResetStatus("success");
                  }} 
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Correo Electrónico</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="email" 
                        required
                        value={emailForReset}
                        onChange={(e) => setEmailForReset(e.target.value)}
                        className="w-full bg-[#131722] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#8A2BE2] transition-colors"
                        placeholder="ejemplo@correo.com"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F3D55B] hover:from-[#F3D55B] hover:to-[#FFF1A0] text-black font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_15px_rgba(212,175,55,0.2)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.3)] tracking-widest uppercase text-sm mt-4 flex items-center justify-center gap-2"
                  >
                    Enviar Enlace <ArrowRight size={18} />
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-green-400 font-bold mb-2">¡Enlace enviado!</p>
                <p className="text-sm text-gray-400 mb-6">
                  Revisa tu bandeja de entrada (y la carpeta de spam). Hemos enviado las instrucciones a <strong className="text-white">{emailForReset}</strong>.
                </p>
                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="bg-[#1E1133] hover:bg-[#2A1A4A] border border-[#8A2BE2]/50 text-white font-bold py-3 px-8 rounded-xl transition-colors tracking-widest uppercase text-xs"
                >
                  Volver a mi perfil
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}