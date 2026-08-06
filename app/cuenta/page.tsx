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
import { ApiError, api } from "@/lib/api";
import type { RangoEdad } from "@/lib/api";

const RANGOS_DE_EDAD: RangoEdad[] = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];

const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 });

export default function CuentaPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance } = useBalanceStore();
  const { addNotification } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<"perfil" | "seguridad" | "preferencias">("perfil");
  const [isEditing, setIsEditing] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null);

  /**
   * Lo que el backend guarda de verdad de un participante.
   *
   * `alias` y `rango_edad` son los dos únicos campos editables (`PATCH
   * /usuarios/:id` exige al menos uno). No hay nombre ni teléfono: el estudio no
   * los necesita, y el correo no se persiste en claro —solo su HMAC—, así que ni
   * siquiera se puede mostrar de vuelta.
   */
  const [formData, setFormData] = useState({
    alias: "",
    rango_edad: "" as RangoEdad | "",
  });

  const [showAnonimizarModal, setShowAnonimizarModal] = useState(false);
  const [anonimizando, setAnonimizando] = useState(false);
  const [avisoAnonimizado, setAvisoAnonimizado] = useState<string | null>(null);

  // Estados para el Modal de Cambiar Contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [emailForReset, setEmailForReset] = useState("");
  const [resetStatus, setResetStatus] = useState<"idle" | "success">("idle");

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else {
      setFormData({
        alias: user.participante.alias,
        rango_edad: user.participante.rango_edad,
      });
    }
  }, [user, router]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setGuardando(true);
    setErrorPerfil(null);

    try {
      // Dueño o admin: la política la resuelve el caso de uso con el `:id`.
      const { participante } = await api.usuarios.actualizar(user.participante.id, {
        alias: formData.alias,
        rango_edad: formData.rango_edad || undefined,
      });

      // Se refleja en el store para que el Navbar y el avatar cambien al vuelo.
      useAuthStore.setState({
        participante,
        user: { participante, cuenta: user.cuenta },
      });
      setIsEditing(false);
      addNotification("Tu perfil se actualizó en el laboratorio.");
    } catch (error) {
      setErrorPerfil(error instanceof ApiError ? error.message : "No se pudo actualizar el perfil");
    } finally {
      setGuardando(false);
    }
  };

  const anonimizarCuenta = async () => {
    if (!user) return;
    setAnonimizando(true);
    try {
      // Responde 200 con el recurso resultante, no 204: el cliente tiene que
      // poder ver el estado final y que la fila sigue ahí.
      const respuesta = await api.usuarios.anonimizar(user.participante.id);
      setShowAnonimizarModal(false);
      setAvisoAnonimizado(respuesta.mensaje);
      addNotification("Tu participación quedó anonimizada.");
    } catch (error) {
      setAvisoAnonimizado(error instanceof ApiError ? error.message : "No se pudo anonimizar la cuenta");
      setShowAnonimizarModal(false);
    } finally {
      setAnonimizando(false);
    }
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
            <p className="text-gray-400 mb-4">
              <span className="font-mono text-xs">{user.participante.codigo_publico.slice(0, 8)}</span> • Miembro desde {new Date(user.participante.creado_at).getFullYear()}
            </p>
            
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
                    onClick={() => void handleSaveProfile()}
                    disabled={guardando}
                    className="bg-gradient-to-r from-[#15803d] to-[#166534] hover:from-[#16a34a] hover:to-[#15803d] text-white border border-green-500 p-2 md:px-4 md:py-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(21,128,61,0.3)] disabled:opacity-50"
                  >
                    <Save size={14} /> <span className="hidden md:inline">{guardando ? "Guardando…" : "Guardar"}</span>
                  </button>
                )}
              </div>
              
              <div className="p-6 lg:p-8 space-y-6">
                {errorPerfil && (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {errorPerfil}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Alias de Juego</label>
                    <div className="relative">
                      <Gamepad2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        disabled={!isEditing}
                        minLength={3}
                        maxLength={40}
                        value={formData.alias}
                        onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                        className="w-full bg-[#131722] border border-white/10 disabled:border-transparent disabled:opacity-70 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#8A2BE2] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rango de Edad</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <select
                        disabled={!isEditing}
                        value={formData.rango_edad}
                        onChange={(e) => setFormData({ ...formData, rango_edad: e.target.value as RangoEdad })}
                        className="w-full appearance-none bg-[#131722] border border-white/10 disabled:border-transparent disabled:opacity-70 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#8A2BE2] transition-colors [&>option]:bg-[#131722]"
                      >
                        {RANGOS_DE_EDAD.map((rango) => (
                          <option key={rango} value={rango}>
                            {rango}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[10px] text-gray-500">El estudio agrupa por rango, nunca por fecha exacta.</p>
                  </div>

                  {/* Identificador público del participante: es el que aparece en
                      los informes del estudio, disociado de la cuenta. */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Código Público</label>
                    <div className="relative">
                      <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        disabled
                        value={user.participante.codigo_publico}
                        className="w-full bg-[#131722] border-transparent opacity-70 rounded-xl py-3 pl-10 pr-4 text-sm font-mono text-gray-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Correo Electrónico</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        disabled
                        value="No se guarda en claro"
                        className="w-full bg-[#131722] border-transparent opacity-70 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-[#D4AF37] flex items-center gap-1">
                      <Check size={10} /> El servidor solo guarda su HMAC: sirve para el login y para nada más.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rol</label>
                    <div className="relative">
                      <Crown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        disabled
                        value={user.cuenta.rol}
                        className="w-full bg-[#131722] border-transparent opacity-70 rounded-xl py-3 pl-10 pr-4 text-sm capitalize text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500">Se lee de la base en cada petición, no del token.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Último Acceso</label>
                    <div className="relative">
                      <History size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        disabled
                        value={
                          user.cuenta.ultimo_acceso_at
                            ? new Date(user.cuenta.ultimo_acceso_at).toLocaleString("es-MX")
                            : "—"
                        }
                        className="w-full bg-[#131722] border-transparent opacity-70 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-400 cursor-not-allowed"
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
                      setEmailForReset("");
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

                {/* Anonimizar no es borrar: la fila sigue ahí, disociada. Es la
                    diferencia entre "que no se sepa quién fuiste" y "que el
                    estudio pierda los datos que ya analizó". */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border border-red-500/20 rounded-xl bg-red-950/10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30 text-red-400">
                      <User size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Anonimizar mi participación</h4>
                      <p className="text-xs text-gray-400 mt-0.5 max-w-md leading-relaxed">
                        Tu alias y tu correo dejan de estar asociados a lo recolectado. Los resultados del estudio se
                        conservan disociados: la fila no se borra, se desliga de ti.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAnonimizarModal(true)}
                    className="w-full md:w-auto shrink-0 border border-red-500/40 text-red-300 hover:bg-red-500 hover:text-white font-bold py-2 px-4 rounded-lg transition-colors text-xs uppercase tracking-widest"
                  >
                    Anonimizar
                  </button>
                </div>

                {avisoAnonimizado && (
                  <p className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-3 text-sm text-[#D4AF37]">
                    {avisoAnonimizado}
                  </p>
                )}
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

      {/* CONFIRMACIÓN DE ANONIMIZADO */}
      {showAnonimizarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-[#0B0E14] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
                <AlertCircle size={22} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">¿Anonimizar tu participación?</h3>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-gray-400">
              Tu alias y tu correo dejan de identificarte. Lo que ya se recolectó en tus sesiones{" "}
              <span className="text-white">no se borra</span>: se conserva disociado para el estudio.
            </p>
            <p className="mb-6 text-xs leading-relaxed text-gray-500">
              Si lo que quieres es borrar lo recolectado, eso es otra cosa y está en el panel de permisos:
              &ldquo;Revocar y borrar todo lo de esta sesión&rdquo;.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAnonimizarModal(false)}
                className="flex-1 rounded-xl border border-white/10 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={() => void anonimizarCuenta()}
                disabled={anonimizando}
                className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-xs font-bold uppercase tracking-widest text-red-400 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50"
              >
                {anonimizando ? "Anonimizando…" : "Anonimizar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}