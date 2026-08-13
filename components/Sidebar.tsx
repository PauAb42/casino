"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, Gamepad2, Gift, BarChart2, User, 
  HeadphonesIcon, ShieldAlert, LogOut,
  ChevronLeft, ChevronRight, Wallet, Plus, Key, Cctv
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useBalanceStore } from "@/lib/balanceStore";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const saldo = useBalanceStore((s) => s.saldo);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  const formattedBalance = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(saldo);

  // Ocultar el Sidebar en las pantallas de autenticación o la sala dinámica
  if (pathname === "/login" || pathname === "/registro" || pathname === "/recuperar" || pathname.startsWith("/juegos/")) {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  const confirmLogout = () => {
    if (logout) logout();
    setShowLogoutAlert(false);
    router.push("/login");
  };

  return (
    <>
      <aside 
        className={`bg-[#0B0E14]/95 backdrop-blur-xl flex flex-col h-screen border-r border-white/5 sticky top-0 z-40 shadow-2xl shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-[80px]" : "w-[280px]"
        }`}
      >
        {/* Botón de Colapsar Integrado arriba */}
        <div className={`flex items-center pt-6 pb-2 border-b border-white/5 shrink-0 transition-all duration-300 ${isCollapsed ? "justify-center" : "justify-between px-6"}`}>
          {!isCollapsed && <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">Panel de Control</span>}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title={isCollapsed ? "Expandir menú" : "Contraer menú"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Zona de Acción (Usuario o Invitado) */}
        <div className={`p-6 border-b border-white/5 flex flex-col transition-all duration-300 ${isCollapsed ? "items-center px-2" : ""}`}>
          {user ? (
            <>
              {!isCollapsed && <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">Saldo Principal</p>}
              
              {isCollapsed ? (
                <div className="w-10 h-10 rounded-full bg-[#131722] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-4 shadow-inner" title={`Saldo: $${formattedBalance} MXN`}>
                  <Wallet size={16} />
                </div>
              ) : (
                <p className="text-2xl font-bold text-white mb-4 drop-shadow-md">
                  $ {formattedBalance} <span className="text-xs text-gray-500 font-normal">MXN</span>
                </p>
              )}

              <button 
                onClick={() => router.push("/cajero")}
                className={`bg-[#3B2063] hover:bg-[#4A297C] text-white rounded-xl flex items-center justify-center font-bold tracking-widest uppercase transition-colors shadow-lg ${
                  isCollapsed ? "w-10 h-10 p-0" : "w-full py-3 gap-2 text-[11px]"
                }`}
                title="Depositar"
              >
                <Plus size={isCollapsed ? 18 : 16} className={!isCollapsed ? "mb-0.5" : ""} />
                {!isCollapsed && "DEPOSITAR"}
              </button>
            </>
          ) : (
            <>
              {!isCollapsed && (
                <>
                  <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-2">¿No tienes cuenta?</p>
                  <p className="text-xs font-medium text-gray-300 mb-4 leading-relaxed">
                    Recibe <span className="text-[#D4AF37] font-bold">1000 fichas</span> hoy.
                  </p>
                </>
              )}
              <Link 
                href="/registro" 
                className={`bg-gradient-to-r from-[#D4AF37] to-[#F3D55B] hover:from-[#F3D55B] hover:to-[#FFF1A0] text-black rounded-xl flex items-center justify-center font-bold tracking-widest uppercase transition-all shadow-[0_4px_15px_rgba(212,175,55,0.2)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.3)] ${
                  isCollapsed ? "w-10 h-10 p-0" : "w-full py-3 text-[11px]"
                }`}
                title="Crear Cuenta"
              >
                {isCollapsed ? <Key size={18} /> : "CREAR CUENTA"}
              </Link>
            </>
          )}
        </div>

        {/* Navegación Principal */}
        <div className="flex-1 overflow-y-auto py-6 custom-scrollbar overflow-x-hidden">
          
          {!isCollapsed ? (
            <div className="px-8 mb-3 whitespace-nowrap">
              <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Menú Principal</p>
            </div>
          ) : (
            <div className="w-full h-px bg-white/5 my-3"></div>
          )}
          
          <nav className={`space-y-1.5 ${isCollapsed ? "px-2" : "px-4"}`}>
            <Link href="/" title="Inicio" className={`group flex items-center rounded-xl transition-all ${isCollapsed ? 'justify-center py-3' : 'gap-3 px-4 py-3'} ${isActive('/') ? 'bg-gradient-to-r from-[#8A2BE2]/20 to-transparent text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <Home size={18} className={`shrink-0 ${isActive('/') ? "text-[#8A2BE2]" : "group-hover:text-[#8A2BE2] transition-colors"}`} />
              {!isCollapsed && <span className="text-sm font-medium tracking-wide whitespace-nowrap">Inicio</span>}
            </Link>
            
            <Link href="/juegos" title="Juegos" className={`group flex items-center rounded-xl transition-all ${isCollapsed ? 'justify-center py-3' : 'gap-3 px-4 py-3'} ${isActive('/juegos') ? 'bg-gradient-to-r from-[#8A2BE2]/20 to-transparent text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <Gamepad2 size={18} className={`shrink-0 ${isActive('/juegos') ? "text-[#8A2BE2]" : "group-hover:text-[#8A2BE2] transition-colors"}`} />
              {!isCollapsed && <span className="text-sm font-medium tracking-wide whitespace-nowrap">Juegos</span>}
            </Link>

            <Link href="/promociones" title="Promociones" className={`group flex items-center rounded-xl transition-all ${isCollapsed ? 'justify-center py-3' : 'gap-3 px-4 py-3'} ${isActive('/promociones') ? 'bg-gradient-to-r from-[#8A2BE2]/20 to-transparent text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <Gift size={18} className={`shrink-0 ${isActive('/promociones') ? "text-[#8A2BE2]" : "group-hover:text-[#8A2BE2] transition-colors"}`} />
              {!isCollapsed && <span className="text-sm font-medium tracking-wide whitespace-nowrap">Promociones</span>}
            </Link>

            <Link href="/resultados" title="Resultados" className={`group flex items-center rounded-xl transition-all ${isCollapsed ? 'justify-center py-3' : 'gap-3 px-4 py-3'} ${isActive('/resultados') ? 'bg-gradient-to-r from-[#8A2BE2]/20 to-transparent text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <BarChart2 size={18} className={`shrink-0 ${isActive('/resultados') ? "text-[#8A2BE2]" : "group-hover:text-[#8A2BE2] transition-colors"}`} />
              {!isCollapsed && <span className="text-sm font-medium tracking-wide whitespace-nowrap">Resultados</span>}
            </Link>

            {user && (
              <>
                <div className="w-full h-px bg-white/5 my-4"></div>
                
                <Link href="/cuenta" title="Mi Cuenta" className={`group flex items-center rounded-xl transition-all ${isCollapsed ? 'justify-center py-3' : 'gap-3 px-4 py-3'} ${isActive('/cuenta') ? 'bg-gradient-to-r from-[#8A2BE2]/20 to-transparent text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
                  <User size={18} className={`shrink-0 ${isActive('/cuenta') ? "text-[#8A2BE2]" : "group-hover:text-[#8A2BE2] transition-colors"}`} />
                  {!isCollapsed && <span className="text-sm font-medium tracking-wide whitespace-nowrap">Mi Cuenta</span>}
                </Link>
                
                <Link href="/vigilancia" title="Sala de Vigilancia" className={`group flex items-center rounded-xl transition-all ${isCollapsed ? 'justify-center py-3' : 'gap-3 px-4 py-3'} ${isActive('/vigilancia') ? 'bg-gradient-to-r from-red-500/20 to-transparent text-white border-l-2 border-red-500' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
                  <Cctv size={18} className={`shrink-0 ${isActive('/vigilancia') ? "text-red-400" : "group-hover:text-red-400 transition-colors"}`} />
                  {!isCollapsed && <span className="text-sm font-bold text-red-400/80 group-hover:text-red-400 tracking-wide whitespace-nowrap transition-colors">Sala de Vigilancia</span>}
                </Link>
              </>
            )}
          </nav>

          {!isCollapsed ? (
            <div className="px-8 mt-10 mb-3 whitespace-nowrap">
              <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Más Opciones</p>
            </div>
          ) : (
            <div className="w-full h-px bg-white/5 my-6"></div>
          )}
          
          <nav className={`space-y-1.5 ${isCollapsed ? "px-2" : "px-4"}`}>
            <Link href="/soporte" title="Soporte" className={`group flex items-center rounded-xl transition-all ${isCollapsed ? 'justify-center py-3' : 'gap-3 px-4 py-3'} ${isActive('/soporte') ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <HeadphonesIcon size={18} className="shrink-0 group-hover:text-[#8A2BE2] transition-colors"/>
              {!isCollapsed && <span className="text-sm font-medium tracking-wide whitespace-nowrap">Soporte</span>}
            </Link>
            
            <Link href="/responsable" title="Juego Responsable" className={`group flex items-center rounded-xl transition-all ${isCollapsed ? 'justify-center py-3' : 'gap-3 px-4 py-3'} ${isActive('/responsable') ? 'bg-gradient-to-r from-[#8A2BE2]/20 to-transparent text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <ShieldAlert size={18} className={`shrink-0 ${isActive('/responsable') ? "text-[#8A2BE2]" : "group-hover:text-[#8A2BE2] transition-colors"}`}/>
              {!isCollapsed && <span className="text-sm font-medium tracking-wide whitespace-nowrap">Juego Responsable</span>}
            </Link>
            
            {user && (
              <button onClick={() => setShowLogoutAlert(true)} title="Cerrar Sesión" className={`group flex items-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all mt-4 ${isCollapsed ? 'justify-center py-3' : 'gap-3 px-4 py-3 w-full text-left'}`}>
                <LogOut size={18} className="shrink-0 group-hover:text-red-400 transition-colors" />
                {!isCollapsed && <span className="text-sm font-medium tracking-wide whitespace-nowrap">Cerrar Sesión</span>}
              </button>
            )}
          </nav>

        </div>
      </aside>

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