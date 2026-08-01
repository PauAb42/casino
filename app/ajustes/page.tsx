"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Settings, Bell, ShieldAlert, Sliders, 
  ChevronLeft, Crown, Save, Volume2, 
  Globe, Moon, Smartphone, Mail, Lock, 
  AlertTriangle, CheckCircle, EyeOff, Sparkles,
  X, Download, Cookie, Loader2
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useBalanceStore } from "@/lib/balanceStore";
import { useNotificationStore } from "@/lib/notificationStore";

const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 });

export default function AjustesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance } = useBalanceStore();
  const { addNotification } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<"general" | "notificaciones" | "responsable" | "privacidad">("general");
  const [isSaving, setIsSaving] = useState(false);

  // Estados de Ajustes Generales
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [language, setLanguage] = useState("es");
  const [theme, setTheme] = useState("dark");

  // Estados de Notificaciones
  const [emailPromo, setEmailPromo] = useState(true);
  const [emailSecurity, setEmailSecurity] = useState(true); 
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Estados de Juego Responsable
  const [depositLimit, setDepositLimit] = useState("5000");
  const [sessionLimit, setSessionLimit] = useState("120");

  // Estados de Privacidad
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [cookies, setCookies] = useState({ analytics: true, marketing: false });
  const [isRequestingData, setIsRequestingData] = useState(false);
  const [dataRequested, setDataRequested] = useState(false);

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      addNotification("Tus ajustes han sido guardados y aplicados exitosamente.");
    }, 1500);
  };

  const handleSaveCookies = () => {
    setShowCookieModal(false);
    addNotification("Tus preferencias de cookies han sido actualizadas.");
  };

  const handleRequestData = () => {
    setIsRequestingData(true);
    setTimeout(() => {
      setIsRequestingData(false);
      setDataRequested(true);
      addNotification("Tu archivo de datos ha sido generado y enviado a tu correo electrónico registrado.");
    }, 2500);
  };

  if (!user) return <div className="min-h-screen bg-[#05050A]"></div>;

  // Componente interno para Toggle Switches
  const ToggleSwitch = ({ checked, onChange, disabled = false }: { checked: boolean, onChange: () => void, disabled?: boolean }) => (
    <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} disabled={disabled} />
      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8A2BE2]"></div>
    </label>
  );

  return (
    <div className="min-h-screen bg-[#05050A] text-white font-sans flex flex-col pb-10 relative">
      
      {/* HEADER TIPO CASINO */}
      <header className="h-16 shrink-0 border-b border-white/5 flex items-center justify-between px-4 lg:px-6 bg-[#0B0E14] relative z-20">
        <div className="flex items-center gap-4 w-1/3">
          <button onClick={() => router.push("/cuenta")} className="flex items-center justify-center w-8 h-8 rounded border border-white/10 hover:bg-white/5 transition-colors">
            <ChevronLeft size={20} className="text-[#D4AF37]" />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-widest uppercase">Configuración</h1>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">Panel de Control</p>
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
            <span className="font-black text-[#D4AF37] text-sm">{currency.format(balance)}</span>
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 lg:px-8 flex flex-col lg:flex-row gap-8 relative z-10">
        
        {/* SIDEBAR NAVEGACIÓN */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="flex items-center gap-3 mb-6 px-2">
            <Settings size={24} className="text-[#8A2BE2]" />
            <h2 className="text-2xl font-bold">Ajustes</h2>
          </div>

          <div className="bg-[#0B0E14] border border-white/5 rounded-2xl p-2 shadow-xl flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 custom-scrollbar">
            <button 
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-xs lg:text-sm tracking-wide shrink-0 ${activeTab === "general" ? "bg-[#1E1133] text-[#8A2BE2]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              <Sliders size={18} /> General e Interfaz
            </button>
            <button 
              onClick={() => setActiveTab("notificaciones")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-xs lg:text-sm tracking-wide shrink-0 ${activeTab === "notificaciones" ? "bg-[#1E1133] text-[#8A2BE2]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              <Bell size={18} /> Alertas y Avisos
            </button>
            <button 
              onClick={() => setActiveTab("responsable")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-xs lg:text-sm tracking-wide shrink-0 ${activeTab === "responsable" ? "bg-[#1E1133] text-[#8A2BE2]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              <ShieldAlert size={18} /> Juego Responsable
            </button>
            <button 
              onClick={() => setActiveTab("privacidad")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-xs lg:text-sm tracking-wide shrink-0 ${activeTab === "privacidad" ? "bg-[#1E1133] text-[#8A2BE2]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              <EyeOff size={18} /> Privacidad y Datos
            </button>
          </div>
        </aside>

        {/* ÁREA DE CONTENIDO */}
        <div className="flex-1 bg-[#0B0E14] border border-white/5 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          
          <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar">
            
            {/* 1. GENERAL E INTERFAZ */}
            {activeTab === "general" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-2">General e Interfaz</h3>
                  <p className="text-sm text-gray-400">Personaliza la apariencia y el comportamiento del casino.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-[#131722] border border-white/5 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#1E1133] flex items-center justify-center text-[#8A2BE2]">
                        <Volume2 size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Efectos de Sonido</h4>
                        <p className="text-xs text-gray-400">Reproducir audios de los juegos y alertas.</p>
                      </div>
                    </div>
                    <ToggleSwitch checked={soundEnabled} onChange={() => setSoundEnabled(!soundEnabled)} />
                  </div>

                  <div className="flex items-center justify-between p-5 bg-[#131722] border border-white/5 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#1E1133] flex items-center justify-center text-[#8A2BE2]">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Animaciones de Alta Calidad</h4>
                        <p className="text-xs text-gray-400">Desactiva si tienes problemas de rendimiento.</p>
                      </div>
                    </div>
                    <ToggleSwitch checked={animationsEnabled} onChange={() => setAnimationsEnabled(!animationsEnabled)} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-[#131722] border border-white/5 rounded-xl space-y-3">
                      <div className="flex items-center gap-3 mb-2">
                        <Globe size={18} className="text-[#D4AF37]" />
                        <h4 className="font-bold text-sm">Idioma</h4>
                      </div>
                      <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-[#8A2BE2] transition-colors"
                      >
                        <option value="es">Español (México)</option>
                        <option value="en">English (US)</option>
                        <option value="pt">Português (BR)</option>
                      </select>
                    </div>

                    <div className="p-5 bg-[#131722] border border-white/5 rounded-xl space-y-3">
                      <div className="flex items-center gap-3 mb-2">
                        <Moon size={18} className="text-[#D4AF37]" />
                        <h4 className="font-bold text-sm">Tema</h4>
                      </div>
                      <select 
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-[#8A2BE2] transition-colors"
                      >
                        <option value="dark">Oscuro (Recomendado)</option>
                        <option value="light">Claro</option>
                        <option value="auto">Sistema</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. NOTIFICACIONES */}
            {activeTab === "notificaciones" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-2">Alertas y Avisos</h3>
                  <p className="text-sm text-gray-400">Administra los canales por los que nos comunicamos contigo.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-[#131722] border border-white/5 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center border border-blue-500/20 text-blue-400">
                        <Mail size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Ofertas y Promociones</h4>
                        <p className="text-xs text-gray-400">Nuevos bonos, giros gratis y torneos VIP por correo.</p>
                      </div>
                    </div>
                    <ToggleSwitch checked={emailPromo} onChange={() => setEmailPromo(!emailPromo)} />
                  </div>

                  <div className="flex items-center justify-between p-5 bg-[#131722] border border-white/5 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-900/20 flex items-center justify-center border border-green-500/20 text-green-400">
                        <Lock size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Seguridad y Retiros (Obligatorio)</h4>
                        <p className="text-xs text-gray-400">Avisos por correo sobre inicios de sesión y fondos.</p>
                      </div>
                    </div>
                    <ToggleSwitch checked={emailSecurity} onChange={() => setEmailSecurity(!emailSecurity)} disabled />
                  </div>

                  <div className="flex items-center justify-between p-5 bg-[#131722] border border-white/5 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-yellow-900/20 flex items-center justify-center border border-yellow-500/20 text-yellow-400">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Mensajes SMS</h4>
                        <p className="text-xs text-gray-400">Alertas de texto a tu número verificado.</p>
                      </div>
                    </div>
                    <ToggleSwitch checked={smsAlerts} onChange={() => setSmsAlerts(!smsAlerts)} />
                  </div>

                  <div className="flex items-center justify-between p-5 bg-[#131722] border border-white/5 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#1E1133] flex items-center justify-center border border-[#8A2BE2]/30 text-[#8A2BE2]">
                        <Bell size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Notificaciones Push</h4>
                        <p className="text-xs text-gray-400">Alertas en vivo dentro de la plataforma (Navbar).</p>
                      </div>
                    </div>
                    <ToggleSwitch checked={pushNotifications} onChange={() => setPushNotifications(!pushNotifications)} />
                  </div>
                </div>
              </div>
            )}

            {/* 3. JUEGO RESPONSABLE */}
            {activeTab === "responsable" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-2 text-red-400 flex items-center gap-2">
                    <ShieldAlert size={24} /> Juego Responsable
                  </h3>
                  <p className="text-sm text-gray-400">Tu bienestar es nuestra prioridad. Configura tus límites de juego aquí.</p>
                </div>

                <div className="space-y-6">
                  {/* Límite de Depósito */}
                  <div className="p-6 bg-[#131722] border border-red-500/20 rounded-xl">
                    <h4 className="font-bold text-sm mb-2 text-white">Límite de Depósito Diario</h4>
                    <p className="text-xs text-gray-400 mb-4">Establece la cantidad máxima que puedes depositar en un periodo de 24 horas.</p>
                    
                    <div className="flex items-center gap-4">
                      <select 
                        value={depositLimit}
                        onChange={(e) => setDepositLimit(e.target.value)}
                        className="bg-[#0B0E14] border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-red-400 transition-colors w-48"
                      >
                        <option value="1000">$1,000 MXN</option>
                        <option value="5000">$5,000 MXN</option>
                        <option value="10000">$10,000 MXN</option>
                        <option value="unlimited">Sin límite</option>
                      </select>
                      {depositLimit !== "unlimited" && <CheckCircle size={18} className="text-green-500" />}
                    </div>
                  </div>

                  {/* Límite de Sesión */}
                  <div className="p-6 bg-[#131722] border border-red-500/20 rounded-xl">
                    <h4 className="font-bold text-sm mb-2 text-white">Límite de Tiempo de Sesión</h4>
                    <p className="text-xs text-gray-400 mb-4">Te avisaremos cuando alcances el límite de tiempo continuo jugando.</p>
                    
                    <div className="flex items-center gap-4">
                      <select 
                        value={sessionLimit}
                        onChange={(e) => setSessionLimit(e.target.value)}
                        className="bg-[#0B0E14] border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-red-400 transition-colors w-48"
                      >
                        <option value="30">30 minutos</option>
                        <option value="60">1 hora</option>
                        <option value="120">2 horas</option>
                        <option value="unlimited">Sin límite</option>
                      </select>
                    </div>
                  </div>

                  {/* Autoexclusión */}
                  <div className="p-6 bg-red-950/20 border border-red-500/50 rounded-xl">
                    <div className="flex items-start gap-4">
                      <AlertTriangle size={24} className="text-red-500 shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-sm mb-2 text-red-400">Autoexclusión Temporal</h4>
                        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                          Si sientes que necesitas un descanso, puedes bloquear el acceso a tu cuenta de 1 a 6 meses. Durante este periodo, no podrás depositar, apostar ni recibir correos promocionales.
                        </p>
                        <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors text-xs uppercase tracking-widest shadow-lg">
                          Configurar Autoexclusión
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. PRIVACIDAD Y DATOS */}
            {activeTab === "privacidad" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-2">Privacidad y Datos</h3>
                  <p className="text-sm text-gray-400">Gestiona cómo almacenamos y utilizamos tu información.</p>
                </div>

                <div className="space-y-4">
                  {/* Cookies */}
                  <div className="p-5 bg-[#131722] border border-white/5 rounded-xl space-y-4">
                    <div>
                      <h4 className="font-bold text-sm">Política de Cookies</h4>
                      <p className="text-xs text-gray-400 mt-1">Utilizamos cookies esenciales para el funcionamiento del casino. Las cookies de marketing son opcionales.</p>
                    </div>
                    <button 
                      onClick={() => setShowCookieModal(true)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2 px-4 rounded-lg transition-colors text-xs uppercase tracking-widest flex items-center gap-2"
                    >
                      <Cookie size={16} /> Administrar Cookies
                    </button>
                  </div>

                  {/* Descarga de Datos */}
                  <div className="p-5 bg-[#131722] border border-white/5 rounded-xl space-y-4">
                    <div>
                      <h4 className="font-bold text-sm">Descargar mis datos</h4>
                      <p className="text-xs text-gray-400 mt-1">Solicita un archivo con el registro de tus apuestas, transacciones e información personal.</p>
                    </div>
                    <button 
                      onClick={handleRequestData}
                      disabled={isRequestingData || dataRequested}
                      className={`font-bold py-2 px-4 rounded-lg transition-colors text-xs uppercase tracking-widest flex items-center gap-2 ${
                        dataRequested 
                          ? "bg-green-900/30 text-green-400 border border-green-500/30 cursor-not-allowed" 
                          : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                      }`}
                    >
                      {isRequestingData ? (
                        <><Loader2 size={16} className="animate-spin" /> Procesando...</>
                      ) : dataRequested ? (
                        <><CheckCircle size={16} /> Solicitud Enviada</>
                      ) : (
                        <><Download size={16} /> Solicitar Archivo</>
                      )}
                    </button>
                  </div>

                  {/* Eliminar Cuenta */}
                  <div className="p-5 bg-[#0B0E14] border border-red-500/20 rounded-xl space-y-4 mt-8">
                    <div>
                      <h4 className="font-bold text-sm text-red-400">Eliminar Cuenta</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Este proceso es irreversible. Se eliminarán permanentemente tus datos, saldo restante y beneficios del nivel VIP.
                      </p>
                    </div>
                    <button className="bg-transparent hover:bg-red-500/10 border border-red-500/50 text-red-400 font-bold py-2 px-4 rounded-lg transition-colors text-xs uppercase tracking-widest">
                      Solicitar Eliminación
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BOTÓN FLOTANTE/ESTÁTICO DE GUARDAR */}
          <div className="p-6 border-t border-white/5 bg-[#0B0E14] flex justify-end">
            <button 
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="bg-gradient-to-r from-[#D4AF37] to-[#F3D55B] hover:from-[#F3D55B] hover:to-[#FFF1A0] text-black font-black py-3.5 px-10 rounded-xl transition-all shadow-[0_5px_20px_rgba(212,175,55,0.2)] tracking-widest uppercase text-sm flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
            >
              {isSaving ? (
                <><Loader2 size={18} className="animate-spin" /> Cargando...</>
              ) : (
                <><Save size={18} /> Guardar Cambios</>
              )}
            </button>
          </div>

        </div>
      </main>

      {/* MODAL DE COOKIES */}
      {showCookieModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05050A]/80 backdrop-blur-sm p-4">
          <div className="bg-[#0B0E14] border border-[#8A2BE2]/50 p-6 md:p-8 rounded-3xl shadow-[0_0_50px_rgba(138,43,226,0.2)] w-full max-w-md relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowCookieModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <Cookie size={28} className="text-[#D4AF37]" />
              <h2 className="text-xl font-bold text-white">Preferencias de Cookies</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-gray-200">Cookies Esenciales</h4>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">Necesarias para que la plataforma funcione (inicio de sesión, seguridad, saldo). No pueden desactivarse.</p>
                </div>
                <ToggleSwitch checked={true} onChange={() => {}} disabled />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-gray-200">Cookies de Analíticas</h4>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">Nos ayudan a entender cómo usas Royal Casino para mejorar tu experiencia de juego.</p>
                </div>
                <ToggleSwitch checked={cookies.analytics} onChange={() => setCookies({...cookies, analytics: !cookies.analytics})} />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-gray-200">Cookies de Marketing</h4>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">Se utilizan para rastrear visitantes y ofrecer bonos y promociones personalizadas.</p>
                </div>
                <ToggleSwitch checked={cookies.marketing} onChange={() => setCookies({...cookies, marketing: !cookies.marketing})} />
              </div>
            </div>

            <button 
              onClick={handleSaveCookies}
              className="w-full bg-[#1E1133] hover:bg-[#2A1A4A] border border-[#8A2BE2]/50 text-white font-bold py-3.5 rounded-xl transition-colors tracking-widest uppercase text-xs mt-8"
            >
              Guardar Preferencias
            </button>
          </div>
        </div>
      )}

    </div>
  );
}