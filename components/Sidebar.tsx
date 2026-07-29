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

  // Ocultar el Sidebar en las pantallas de autenticación
  if (pathname === "/login" || pathname === "/registro") {
    return null;
  }

  // Función auxiliar para saber si un link está activo
  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-[280px] bg-[#0F111A] flex flex-col h-screen border-r border-white/5 sticky top-0">
      <div className="h-20 flex items-center px-6 border-b border-white/5">
        <Link href="/" className="text-[#D4AF37] font-serif text-2xl font-bold flex items-center gap-2">
          <span className="text-3xl">♠</span>
          <div>
            <span className="block leading-none text-white">ROYAL</span>
            <span className="block text-sm leading-none tracking-widest font-sans font-normal text-white">CASINO</span>
          </div>
        </Link>
      </div>

      <div className="p-6 border-b border-white/5">
        {user ? (
          <>
            <p className="text-xs text-gray-400 mb-1">SALDO PRINCIPAL</p>
            <p className="text-2xl font-bold text-white mb-4">$ 12,450.75 <span className="text-sm text-gray-400 font-normal">MXN</span></p>
            <button className="w-full bg-[#3B2063] hover:bg-[#4A297C] text-white py-2 rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors">
              <span>+</span> DEPOSITAR
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-2">¿NO TIENES CUENTA?</p>
            <p className="text-sm font-bold text-[#D4AF37] mb-4">Recibe 1000 fichas virtuales hoy.</p>
            <Link href="/registro" className="w-full bg-[#3B2063] hover:bg-[#4A297C] text-white py-2 rounded flex items-center justify-center text-sm font-medium transition-colors block text-center">
              CREAR CUENTA
            </Link>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-6 mb-2">
          <p className="text-[10px] text-gray-500 font-semibold tracking-wider">MENU PRINCIPAL</p>
        </div>
        <nav className="space-y-1 px-4">
          <Link href="/" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive('/') ? 'bg-[#1E1133] text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Home size={18} className={isActive('/') ? "text-[#8A2BE2]" : ""} />
            <span className="text-sm font-medium">Inicio</span>
          </Link>
          <Link href="/juegos" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive('/juegos') ? 'bg-[#1E1133] text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Gamepad2 size={18} className={isActive('/juegos') ? "text-[#8A2BE2]" : ""} />
            <span className="text-sm font-medium">Juegos</span>
          </Link>
          <Link href="/promociones" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive('/promociones') ? 'bg-[#1E1133] text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Gift size={18} className={isActive('/promociones') ? "text-[#8A2BE2]" : ""} />
            <span className="text-sm font-medium">Promociones</span>
          </Link>
          <Link href="/torneos" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive('/torneos') ? 'bg-[#1E1133] text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Trophy size={18} className={isActive('/torneos') ? "text-[#8A2BE2]" : ""} />
            <span className="text-sm font-medium">Torneos</span>
          </Link>
          <Link href="/resultados" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive('/resultados') ? 'bg-[#1E1133] text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <BarChart2 size={18} className={isActive('/resultados') ? "text-[#8A2BE2]" : ""} />
            <span className="text-sm font-medium">Resultados</span>
          </Link>

          {user && (
            <>
              <Link href="/cuenta" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive('/cuenta') ? 'bg-[#1E1133] text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <User size={18} className={isActive('/cuenta') ? "text-[#8A2BE2]" : ""} />
                <span className="text-sm font-medium">Mi Cuenta</span>
              </Link>
              <Link href="/historial" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive('/historial') ? 'bg-[#1E1133] text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <History size={18} className={isActive('/historial') ? "text-[#8A2BE2]" : ""} />
                <span className="text-sm font-medium">Historial</span>
              </Link>
              <Link href="/mensajes" className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${isActive('/mensajes') ? 'bg-[#1E1133] text-white border-l-2 border-[#8A2BE2]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <div className="flex items-center gap-3">
                  <MessageSquare size={18} className={isActive('/mensajes') ? "text-[#8A2BE2]" : ""} />
                  <span className="text-sm font-medium">Mensajes</span>
                </div>
                <span className="bg-[#8A2BE2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</span>
              </Link>
            </>
          )}
        </nav>

        <div className="px-6 mt-8 mb-2">
          <p className="text-[10px] text-gray-500 font-semibold tracking-wider">MÁS OPCIONES</p>
        </div>
        <nav className="space-y-1 px-4">
          <Link href="/soporte" className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${isActive('/soporte') ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
            <HeadphonesIcon size={18} />
            <span className="text-sm">Soporte</span>
          </Link>
          <Link href="/responsable" className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${isActive('/responsable') ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
            <ShieldAlert size={18} />
            <span className="text-sm">Responsable Juego</span>
          </Link>
          
          {user && (
            <button onClick={logout} className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-red-400 transition-colors w-full text-left mt-2">
              <LogOut size={18} />
              <span className="text-sm">Cerrar Sesión</span>
            </button>
          )}
        </nav>
      </div>
    </aside>
  );
}