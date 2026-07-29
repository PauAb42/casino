"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Info } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(correo, contrasena);
    // Redirige al inicio solo si el login es exitoso
    if (!useAuthStore.getState().error) {
      router.push("/");
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#05050A] text-white">
      
      {/* Fondo preparado para la imagen */}
      <div className="absolute inset-0 bg-[url('/fondo.png')] bg-cover bg-center opacity-40"></div>
      
      {/* Contenedor Centrado de la Tarjeta */}
      <div className="relative z-10 w-full max-w-[480px] px-6">
        
        {/* Tarjeta de Login */}
        <div className="bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl w-full">
          <div className="flex flex-col items-center mb-8">
            <span className="text-[#D4AF37] text-4xl mb-2">♠</span>
            <div className="text-center">
              <span className="block text-[#D4AF37] font-serif text-2xl font-bold leading-none mb-1">ROYAL</span>
              <span className="block text-[#D4AF37] text-xs font-sans tracking-widest uppercase">CASINO</span>
            </div>
            <h1 className="text-2xl font-bold mt-6 mb-2">Bienvenido de nuevo</h1>
            <p className="text-gray-400 text-sm text-center">Inicia sesión para continuar y vivir la emoción</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Correo electrónico o usuario</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-[#131722] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#8A2BE2] transition-colors text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Contraseña</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="•••••••••"
                  className="w-full bg-[#131722] border border-white/10 rounded-lg py-3 pl-10 pr-10 text-white focus:outline-none focus:border-[#8A2BE2] transition-colors text-sm"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-600 text-[#8A2BE2] focus:ring-[#8A2BE2] bg-transparent" />
                <span className="text-gray-300">Recordarme</span>
              </label>
              <Link href="/recuperar" className="text-[#8A2BE2] hover:text-purple-400 transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#3B2063] hover:bg-[#4A297C] text-white font-medium py-3.5 rounded-lg transition-colors mt-2"
            >
              {isLoading ? "Iniciando..." : "INICIAR SESIÓN"}
            </button>
          </form>

          {/* Enlace a Registro */}
          <p className="mt-8 text-center text-sm text-gray-400">
            ¿No tienes una cuenta? <Link href="/registro" className="text-[#8A2BE2] hover:text-purple-400 font-medium">Regístrate ahora</Link>
          </p>
        </div>
      </div>

      {/* Footer inferior sin Seguridad SSL */}
      <div className="absolute bottom-0 w-full border-t border-white/5 py-6 bg-black/40 backdrop-blur-sm px-6">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-x-16 gap-y-4">
          <div className="flex items-center gap-3">
            <Info className="text-purple-500" size={24} />
            <div>
              <p className="text-xs font-bold">Juego Responsable</p>
              <p className="text-[10px] text-gray-500">Jugamos por diversión</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-purple-500" size={24} />
            <div>
              <p className="text-xs font-bold">Licencia Oficial</p>
              <p className="text-[10px] text-gray-500">Operador autorizado</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border border-purple-500 text-purple-500 flex items-center justify-center text-[10px] font-bold">
              18+
            </div>
            <div>
              <p className="text-xs font-bold">Solo mayores de 18</p>
              <p className="text-[10px] text-gray-500">Juega responsablemente</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}