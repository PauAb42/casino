"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, Gift, User, CreditCard, HeadphonesIcon, Bell, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isActive = (path: string) => pathname === path;

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
          
          {/* Botón dinámico dependiendo de si está en login o registro */}
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

  // Navbar normal del Dashboard (Lobby, Juegos, etc.)
  return (
    <header className="h-20 bg-[#0B0E14]/90 backdrop-blur-xl border-b border-white/5 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-50 shadow-xl">
      <div className="flex items-center gap-10 h-full">
        
        {/* Logo integrado en la vista normal */}
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
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-6">
        {user ? (
          <>
            <button className="hidden lg:block text-gray-400 hover:text-[#8A2BE2] transition-colors">
              <HeadphonesIcon size={20} />
            </button>
            <button className="relative text-gray-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#0B0E14]">
                3
              </span>
            </button>
            <div className="flex items-center gap-3 cursor-pointer pl-4 border-l border-white/10 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B2063] to-[#1E1133] flex items-center justify-center border border-[#8A2BE2]/30 text-white font-bold uppercase shadow-inner group-hover:border-[#8A2BE2] transition-colors">
                {user.participante?.alias?.charAt(0) || "U"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-white leading-tight">{user.participante?.alias || "JugadorUno"}</p>
                <p className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase mt-0.5">VIP Bronce</p>
              </div>
              <ChevronDown size={16} className="text-gray-400 group-hover:text-white transition-colors sm:ml-2" />
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
  );
}