"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, Gamepad2, Gift, User, CreditCard,
  HeadphonesIcon, Bell, ChevronDown, LogOut,
  Settings, CheckCheck, Trash2, ScrollText
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useNotificationStore } from "@/lib/notificationStore";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Stores
  const { user, logout } = useAuthStore();
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
  
  // Estados para los dropdowns y modales
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  // Referencias para cerrar al hacer clic afuera
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname === path;
  const unreadCount = notifications.filter(n => !n.read).length;

  // Manejador de clics fuera de los dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerLogoutAlert = () => {
    setIsUserMenuOpen(false);
    setShowLogoutAlert(true);
  };

  // Cierra la sesión de laboratorio como `abandonada` (salir a medias no es
  // terminar el recorrido), limpia la cookie httpOnly con POST /auth/logout y
  // recién entonces suelta la pantalla.
  const confirmLogout = async () => {
    await logout();
    setShowLogoutAlert(false);
    router.push("/login");
  };

  // Renderizado especial si estamos en Login, Registro o Recuperar contraseña
  if (pathname === "/login" || pathname === "/registro" || pathname === "/recuperar") {
    return (
      <header className="h-24 bg-transparent px-8 flex items-center justify-between absolute top-0 w-full z-50">
        <div className="flex items-center gap-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-[#D4AF37] text-3xl drop-shadow-[0_0_10px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-transform">♠</span>
            <div>
              <span className="block text-[#D4AF37] font-serif text-xl font-bold leading-none mb-0.5 tracking-wide">ROYAL</span>
              <span className="block text-[#D4AF37] text-[9px] font-sans tracking-[0.3em] uppercase opacity-80">CASINO</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors group">
              <Home size={16} className="group-hover:text-[#8A2BE2] transition-colors"/> 
              <span className="text-[11px] font-bold tracking-widest uppercase">Lobby</span>
            </Link>
            <Link href="/juegos" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors group">
              <Gamepad2 size={16} className="group-hover:text-[#8A2BE2] transition-colors"/> 
              <span className="text-[11px] font-bold tracking-widest uppercase">Juegos</span>
            </Link>
            <Link href="/promociones" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors group">
              <Gift size={16} className="group-hover:text-[#8A2BE2] transition-colors"/> 
              <span className="text-[11px] font-bold tracking-widest uppercase">Promociones</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/soporte" className="hidden lg:flex items-center gap-2 text-gray-300 hover:text-white transition-colors group">
            <HeadphonesIcon size={16} className="group-hover:text-[#8A2BE2] transition-colors"/> 
            <span className="text-[11px] font-bold tracking-widest uppercase">Soporte</span>
          </Link>
          
          {pathname === "/registro" ? (
            <Link href="/login" className="text-[11px] font-bold tracking-widest uppercase text-white border border-white/20 hover:border-white hover:bg-white/5 py-2.5 px-6 rounded-lg transition-all">
              Iniciar Sesión
            </Link>
          ) : (
            <Link href="/registro" className="bg-gradient-to-r from-[#D4AF37] to-[#F3D55B] hover:from-[#F3D55B] hover:to-[#FFF1A0] text-black text-[11px] font-bold tracking-widest uppercase py-2.5 px-6 rounded-lg transition-all shadow-[0_4px_15px_rgba(212,175,55,0.2)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.3)]">
              Regístrate
            </Link>
          )}
        </div>
      </header>
    );
  }

  // Navbar normal del Dashboard
  return (
    <>
      <header className="h-20 bg-[#0B0E14]/90 backdrop-blur-xl border-b border-white/5 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-10 h-full">
          
          <Link href="/" className="flex items-center gap-2 group mr-2">
            <span className="text-[#D4AF37] text-3xl drop-shadow-[0_0_10px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-transform">♠</span>
            <div className="hidden sm:block">
              <span className="block text-[#D4AF37] font-serif text-xl font-bold leading-none mb-0.5 tracking-wide">ROYAL</span>
              <span className="block text-[#D4AF37] text-[9px] font-sans tracking-[0.3em] uppercase opacity-80">CASINO</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 h-full">
            <Link href="/" className={`flex items-center gap-2 h-full border-b-2 transition-all ${isActive('/') ? 'text-white border-[#8A2BE2]' : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'}`}>
              <Home size={18} className={isActive('/') ? "text-[#8A2BE2]" : ""}/>
              <span className="text-[11px] font-bold tracking-widest uppercase">Lobby</span>
            </Link>
            <Link href="/juegos" className={`flex items-center gap-2 h-full border-b-2 transition-all ${isActive('/juegos') ? 'text-white border-[#8A2BE2]' : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'}`}>
              <Gamepad2 size={18} className={isActive('/juegos') ? "text-[#8A2BE2]" : ""}/>
              <span className="text-[11px] font-bold tracking-widest uppercase">Juegos</span>
            </Link>
            <Link href="/promociones" className={`flex items-center gap-2 h-full border-b-2 transition-all ${isActive('/promociones') ? 'text-white border-[#8A2BE2]' : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'}`}>
              <Gift size={18} className={isActive('/promociones') ? "text-[#8A2BE2]" : ""}/>
              <span className="text-[11px] font-bold tracking-widest uppercase">Promociones</span>
            </Link>
            
            {user && (
              <>
                <Link href="/cuenta" className={`flex items-center gap-2 h-full border-b-2 transition-all ${isActive('/cuenta') ? 'text-white border-[#8A2BE2]' : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'}`}>
                  <User size={18} className={isActive('/cuenta') ? "text-[#8A2BE2]" : ""}/>
                  <span className="text-[11px] font-bold tracking-widest uppercase">Mi Cuenta</span>
                </Link>
                <Link href="/cajero" className={`flex items-center gap-2 h-full border-b-2 transition-all ${isActive('/cajero') ? 'text-white border-[#8A2BE2]' : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'}`}>
                  <CreditCard size={18} className={isActive('/cajero') ? "text-[#8A2BE2]" : ""}/>
                  <span className="text-[11px] font-bold tracking-widest uppercase">Cajero</span>
                </Link>

                {/* El panel del estudio solo aparece con rol; el backend lo
                    vuelve a comprobar en cada petición de todas formas. */}
                {(user.cuenta?.rol === "admin" || user.cuenta?.rol === "investigador") && (
                  <Link href="/panel" className={`flex items-center gap-2 h-full border-b-2 transition-all ${isActive('/panel') ? 'text-white border-[#D4AF37]' : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'}`}>
                    <ScrollText size={18} className={isActive('/panel') ? "text-[#D4AF37]" : ""}/>
                    <span className="text-[11px] font-bold tracking-widest uppercase">Panel</span>
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link href="/soporte" className="hidden lg:flex text-gray-400 hover:text-[#8A2BE2] transition-colors">
                <HeadphonesIcon size={20} />
              </Link>

              {/* DROPDOWN NOTIFICACIONES */}
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)} 
                  className="relative text-gray-400 hover:text-white transition-colors focus:outline-none"
                >
                  <Bell size={20} className={unreadCount > 0 ? "animate-pulse text-[#D4AF37]" : ""} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#0B0E14]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 top-full mt-6 w-80 bg-[#0B0E14] border border-white/10 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                    <div className="p-3 border-b border-white/10 flex justify-between items-center bg-[#131722]">
                      <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">Notificaciones</span>
                      <div className="flex gap-2">
                        <button onClick={markAllAsRead} className="text-gray-400 hover:text-white transition-colors" title="Marcar todas como leídas"><CheckCheck size={14} /></button>
                        <button onClick={clearAll} className="text-gray-400 hover:text-red-400 transition-colors" title="Limpiar todo"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <p className="p-6 text-center text-xs text-gray-500">No tienes notificaciones nuevas.</p>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            onClick={() => markAsRead(notif.id)}
                            className={`p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${!notif.read ? 'bg-[#1E1133]/30' : ''}`}
                          >
                            <p className={`text-xs ${!notif.read ? 'text-white font-bold' : 'text-gray-400'}`}>
                              {notif.message}
                            </p>
                            <span className="text-[9px] text-gray-600 mt-2 block">
                              {notif.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* DROPDOWN USUARIO */}
              <div className="relative border-l border-white/10 pl-4" ref={userMenuRef}>
                <div 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B2063] to-[#1E1133] flex items-center justify-center border border-[#8A2BE2]/30 text-white font-bold uppercase shadow-inner group-hover:border-[#8A2BE2] transition-colors">
                    {user.participante?.alias?.charAt(0) || "U"}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-bold text-white leading-tight">{user.participante?.alias || "JugadorUno"}</p>
                    <p className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase mt-0.5">VIP Bronce</p>
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 group-hover:text-white transition-transform sm:ml-2 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </div>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-4 w-48 bg-[#0B0E14] border border-white/10 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden py-1">
                    <Link href="/cuenta" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                      <User size={14} className="text-[#8A2BE2]" /> Mi Perfil
                    </Link>
                    <Link href="/cajero" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                      <CreditCard size={14} className="text-[#8A2BE2]" /> Depósitos / Retiros
                    </Link>
                    <Link href="/ajustes" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                      <Settings size={14} className="text-[#8A2BE2]" /> Ajustes
                    </Link>
                    <div className="border-t border-white/10 mt-1 mb-1"></div>
                    <button onClick={triggerLogoutAlert} className="w-full flex items-center gap-3 px-4 py-3 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left">
                      <LogOut size={14} /> Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-[11px] font-bold tracking-widest uppercase text-gray-300 hover:text-white transition-colors">
                Iniciar Sesión
              </Link>
              <Link href="/registro" className="bg-gradient-to-r from-[#D4AF37] to-[#F3D55B] hover:from-[#F3D55B] hover:to-[#FFF1A0] text-black text-[11px] font-bold tracking-widest uppercase py-2.5 px-6 rounded-lg transition-all shadow-[0_4px_15px_rgba(212,175,55,0.2)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.3)]">
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* MODAL DE CONFIRMACIÓN DE CIERRE DE SESIÓN */}
      {showLogoutAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0B0E14] border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 opacity-10 blur-[50px] pointer-events-none"></div>
            
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                <LogOut size={32} className="text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">¿Cerrar Sesión?</h3>
              <p className="text-sm text-gray-400 mb-8 leading-relaxed">¿Estás seguro de que deseas salir de tu cuenta en Royal Casino?</p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowLogoutAlert(false)} 
                  className="flex-1 py-3.5 rounded-xl border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmLogout} 
                  className="flex-1 py-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}