"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, Gift, User, CreditCard, HeadphonesIcon, Bell, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isActive = (path: string) => pathname === path;

  // Renderizado especial si estamos en login/registro (Navbar expandido)
  if (pathname === "/login" || pathname === "/registro") {
    return (
      <header className="h-20 bg-transparent px-8 flex items-center justify-between absolute top-0 w-full z-50">
        <div className="flex items-center gap-12">
          <Link href="/" className="text-[#D4AF37] font-serif text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">♠</span>
            <div>
              <span className="block leading-none text-white">ROYAL</span>
              <span className="block text-[10px] leading-none tracking-widest font-sans font-normal text-white">CASINO</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <Home size={16}/> <span className="text-xs tracking-wider">LOBBY</span>
            </Link>
            <Link href="/juegos" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <Gamepad2 size={16}/> <span className="text-xs tracking-wider">JUEGOS</span>
            </Link>
            <Link href="/promociones" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <Gift size={16}/> <span className="text-xs tracking-wider">PROMOCIONES</span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/soporte" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <HeadphonesIcon size={16}/> <span className="text-xs tracking-wider">SOPORTE</span>
          </Link>
          <Link href="/login" className="text-xs font-medium text-white border border-white/20 hover:border-white py-2 px-6 rounded transition-colors">
            INICIAR SESIÓN
          </Link>
          <Link href="/registro" className="bg-[#D4AF37] hover:bg-[#F3D55B] text-black text-xs font-bold py-2 px-6 rounded transition-colors">
            REGÍSTRATE
          </Link>
        </div>
      </header>
    );
  }

  // Navbar normal del Dashboard
  return (
    <header className="h-20 bg-[#0F111A] border-b border-white/5 px-8 flex items-center justify-between sticky top-0 z-10">
      <nav className="flex items-center gap-8 h-full">
        <Link href="/" className={`flex items-center gap-2 h-full border-b-2 transition-colors ${isActive('/') ? 'text-white border-[#8A2BE2]' : 'text-gray-400 border-transparent hover:text-white'}`}>
          <Home size={18} className={isActive('/') ? "text-[#8A2BE2]" : ""}/>
          <span className="text-sm">LOBBY</span>
        </Link>
        <Link href="/juegos" className={`flex items-center gap-2 h-full border-b-2 transition-colors ${isActive('/juegos') ? 'text-white border-[#8A2BE2]' : 'text-gray-400 border-transparent hover:text-white'}`}>
          <Gamepad2 size={18} className={isActive('/juegos') ? "text-[#8A2BE2]" : ""}/>
          <span className="text-sm">JUEGOS</span>
        </Link>
        <Link href="/promociones" className={`flex items-center gap-2 h-full border-b-2 transition-colors ${isActive('/promociones') ? 'text-white border-[#8A2BE2]' : 'text-gray-400 border-transparent hover:text-white'}`}>
          <Gift size={18} className={isActive('/promociones') ? "text-[#8A2BE2]" : ""}/>
          <span className="text-sm">PROMOCIONES</span>
        </Link>
        
        {user && (
          <>
            <Link href="/cuenta" className={`flex items-center gap-2 h-full border-b-2 transition-colors ${isActive('/cuenta') ? 'text-white border-[#8A2BE2]' : 'text-gray-400 border-transparent hover:text-white'}`}>
              <User size={18} className={isActive('/cuenta') ? "text-[#8A2BE2]" : ""}/>
              <span className="text-sm">MI CUENTA</span>
            </Link>
            <Link href="/cajero" className={`flex items-center gap-2 h-full border-b-2 transition-colors ${isActive('/cajero') ? 'text-white border-[#8A2BE2]' : 'text-gray-400 border-transparent hover:text-white'}`}>
              <CreditCard size={18} className={isActive('/cajero') ? "text-[#8A2BE2]" : ""}/>
              <span className="text-sm">CAJERO</span>
            </Link>
          </>
        )}
        <Link href="/soporte" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <HeadphonesIcon size={18}/>
          <span className="text-sm">SOPORTE</span>
        </Link>
      </nav>

      <div className="flex items-center gap-6">
        {user ? (
          <>
            <button className="relative text-gray-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-[#8A2BE2] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-[#1E1133] flex items-center justify-center border border-[#8A2BE2]/30 text-white font-bold uppercase">
                {user.participante?.alias?.charAt(0) || "U"}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user.participante?.alias || "Jugador"}</p>
                <p className="text-[11px] text-[#D4AF37]">Nivel 1</p>
              </div>
              <ChevronDown size={16} className="text-gray-400 ml-2" />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Iniciar Sesión
            </Link>
            <Link href="/registro" className="bg-[#D4AF37] hover:bg-[#F3D55B] text-black text-sm font-bold py-2 px-5 rounded transition-colors">
              Registrarse
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}