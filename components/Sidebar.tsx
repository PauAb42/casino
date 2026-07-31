"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, Gamepad2, Gift, Trophy, BarChart2, User, 
  History, MessageSquare, HeadphonesIcon, ShieldAlert, LogOut 
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  // Ocultar el Sidebar en las pantallas de autenticación o la sala dinámica
  if (pathname === "/login" || pathname === "/registro" || pathname === "/recuperar" || pathname.startsWith("/juegos/")) {
    return null;
  }

  // Función auxiliar para saber si un link está activo
  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-[280px] bg-[#0B0E14]/95 backdrop-blur-xl flex flex-col h-screen border-r border-white/5 sticky top-0 z-40 shadow-2xl shrink-0">
      
      {/* Cabecera / Logo */}
      <div className="h-20 flex items-center px-8 border-b border-white/5 shrink-0">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-[#D4AF37] text-3xl drop-shadow-[0_0_10px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-transform">♠</span>
          <div>
            <span className="block text-[#D4AF37] font-serif text-xl font-bold leading-none mb-0.5 tracking-wide">ROYAL</span>
            <span className="block text-[#D4AF37] text-[9px] font-sans tracking-[0.3em] uppercase opacity-80">CASINO</span>
          </div>
        </Link>
      </div>

      {/* Zona de Acción (Usuario o Invitado) */}
      <div className="p-6 border-b border-white/5">
        {user ? (
          <>
            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">Saldo Principal</p>
            <p className="text-2xl font-bold text-white mb-4 drop-shadow-md">
              $ 12,450.75 <span className="text-xs text-gray-500 font-normal">MXN</span>
            </p>
            <button className="w-full bg-[#3B2063] hover:bg-[#4A297C] text-white py-3 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold tracking-widest uppercase transition-colors shadow-lg">
              <span className="text-lg leading-none mb-0.5">+</span> DEPOSITAR
            </button>
          </>
        ) : (
          <>
            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-2">¿No tienes cuenta?</p>
            <p className="text-xs font-medium text-gray-300 mb-4 leading-relaxed">
              Recibe <span className="text-[#D4AF37] font-bold">1000 fichas</span> virtuales hoy.
            </p>
            <Link href="/registro" className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F3D55B] hover:from-[#F3D55B] hover:to-[#FFF1A0] text-black py-3 rounded-xl flex items-center justify-center text-[11px] font-bold tracking-widest uppercase transition-all shadow-[0_4px_15px_rgba(212,175,55,0.2)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.3)] text-center">
              CREAR CUENTA
            </Link>
          </>
        )}
      </div>

      {/* Navegación Principal */}
      <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
        
        <div className="px-8 mb-3">
          <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Menú Principal</p>
        </div>
        
        <nav className="space-y-1.5 px-4">
          <Link href="/" className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/') ? 'bg-gradient-to-r from-[#8A2BE2]/20 to-transparent text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Home size={18} className={isActive('/') ? "text-[#8A2BE2]" : "group-hover:text-[#8A2BE2] transition-colors"} />
            <span className="text-sm font-medium tracking-wide">Inicio</span>
          </Link>
          <Link href="/juegos" className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/juegos') ? 'bg-gradient-to-r from-[#8A2BE2]/20 to-transparent text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Gamepad2 size={18} className={isActive('/juegos') ? "text-[#8A2BE2]" : "group-hover:text-[#8A2BE2] transition-colors"} />
            <span className="text-sm font-medium tracking-wide">Juegos</span>
          </Link>
          <Link href="/promociones" className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/promociones') ? 'bg-gradient-to-r from-[#8A2BE2]/20 to-transparent text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Gift size={18} className={isActive('/promociones') ? "text-[#8A2BE2]" : "group-hover:text-[#8A2BE2] transition-colors"} />
            <span className="text-sm font-medium tracking-wide">Promociones</span>
          </Link>
          <Link href="/torneos" className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/torneos') ? 'bg-gradient-to-r from-[#8A2BE2]/20 to-transparent text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Trophy size={18} className={isActive('/torneos') ? "text-[#8A2BE2]" : "group-hover:text-[#8A2BE2] transition-colors"} />
            <span className="text-sm font-medium tracking-wide">Torneos</span>
          </Link>
          <Link href="/resultados" className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/resultados') ? 'bg-gradient-to-r from-[#8A2BE2]/20 to-transparent text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <BarChart2 size={18} className={isActive('/resultados') ? "text-[#8A2BE2]" : "group-hover:text-[#8A2BE2] transition-colors"} />
            <span className="text-sm font-medium tracking-wide">Resultados</span>
          </Link>

          {user && (
            <>
              <div className="w-full h-px bg-white/5 my-4"></div>
              <Link href="/cuenta" className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/cuenta') ? 'bg-gradient-to-r from-[#8A2BE2]/20 to-transparent text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <User size={18} className={isActive('/cuenta') ? "text-[#8A2BE2]" : "group-hover:text-[#8A2BE2] transition-colors"} />
                <span className="text-sm font-medium tracking-wide">Mi Cuenta</span>
              </Link>
              <Link href="/historial" className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/historial') ? 'bg-gradient-to-r from-[#8A2BE2]/20 to-transparent text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <History size={18} className={isActive('/historial') ? "text-[#8A2BE2]" : "group-hover:text-[#8A2BE2] transition-colors"} />
                <span className="text-sm font-medium tracking-wide">Historial</span>
              </Link>
              <Link href="/mensajes" className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isActive('/mensajes') ? 'bg-gradient-to-r from-[#8A2BE2]/20 to-transparent text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <div className="flex items-center gap-3">
                  <MessageSquare size={18} className={isActive('/mensajes') ? "text-[#8A2BE2]" : "group-hover:text-[#8A2BE2] transition-colors"} />
                  <span className="text-sm font-medium tracking-wide">Mensajes</span>
                </div>
                <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">2</span>
              </Link>
            </>
          )}
        </nav>

        <div className="px-8 mt-10 mb-3">
          <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Más Opciones</p>
        </div>
        
        <nav className="space-y-1.5 px-4">
          <Link href="/soporte" className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/soporte') ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <HeadphonesIcon size={18} className="group-hover:text-[#8A2BE2] transition-colors"/>
            <span className="text-sm font-medium tracking-wide">Soporte</span>
          </Link>
          <Link href="/responsable" className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/responsable') ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <ShieldAlert size={18} className="group-hover:text-[#8A2BE2] transition-colors"/>
            <span className="text-sm font-medium tracking-wide">Juego Responsable</span>
          </Link>
          
          {user && (
            <button onClick={logout} className="group flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all w-full text-left mt-4">
              <LogOut size={18} className="group-hover:text-red-400 transition-colors" />
              <span className="text-sm font-medium tracking-wide">Cerrar Sesión</span>
            </button>
          )}
        </nav>

      </div>
    </aside>
  );
}