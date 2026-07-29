"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Info, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // 1. Cargar el correo guardado si el usuario usó "Recordarme" antes
  useEffect(() => {
    const savedEmail = localStorage.getItem("royal_casino_email");
    if (savedEmail) {
      setCorreo(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const obtenerMensajeError = (errorTecnico: string) => {
    if (!errorTecnico) return "";
    const errorLower = errorTecnico.toLowerCase();

    if (errorLower.includes("networkerror") || errorLower.includes("failed to fetch")) {
      return "No pudimos conectar con el servidor. Verifica tu conexión a internet o inténtalo más tarde.";
    }
    if (errorLower.includes("401") || errorLower.includes("unauthorized") || errorLower.includes("credenciales")) {
      return "El correo o la contraseña son incorrectos. Por favor, verifica tus datos e inténtalo de nuevo.";
    }
    if (errorLower.includes("404") || errorLower.includes("not found")) {
      return "No encontramos ninguna cuenta asociada a este correo.";
    }
    return errorTecnico; 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // El navegador valida los campos vacíos automáticamente gracias a "required"

    // 2. Lógica para guardar o borrar el correo en el navegador
    if (rememberMe) {
      localStorage.setItem("royal_casino_email", correo);
    } else {
      localStorage.removeItem("royal_casino_email");
    }

    await login(correo, contrasena);
    if (!useAuthStore.getState().error) {
      router.push("/");
    }
  };

  return (
    // CAMBIO CLAVE: 'fixed inset-0' elimina el cuadro del fondo. 
    // 'overflow-y-auto' permite el scroll y evita que se tape el footer.
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#05050A] text-white">
      
      {/* El fondo queda fijo detrás de todo, 100% limpio */}
      <div className="fixed inset-0 bg-[url('/fondo.png')] bg-cover bg-center opacity-40 pointer-events-none"></div>
      
      {/* Contenedor flexible que estructura la página */}
      <div className="flex flex-col min-h-full">
        
        {/* flex-1 empuja el footer hacia abajo, y centra la tarjeta en la pantalla */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full px-6 py-20">
          
          {/* Tarjeta de Login (Diseño exacto al tuyo) */}
          <div className="bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-[480px]">
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
                    className={`w-full bg-[#131722] border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#8A2BE2]'} rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none transition-colors text-sm`}
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
                    className={`w-full bg-[#131722] border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#8A2BE2]'} rounded-lg py-3 pl-10 pr-10 text-white focus:outline-none transition-colors text-sm`}
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
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-[#8A2BE2] focus:ring-[#8A2BE2] bg-transparent cursor-pointer" 
                  />
                  <span className="text-gray-300 select-none">Recordarme</span>
                </label>
                <Link href="/recuperar" className="text-[#8A2BE2] hover:text-purple-400 transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-3 mt-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p className="text-sm font-medium leading-snug">{obtenerMensajeError(error)}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#3B2063] hover:bg-[#4A297C] text-white font-medium py-3.5 rounded-lg transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Iniciando..." : "INICIAR SESIÓN"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-400">
              ¿No tienes una cuenta? <Link href="/registro" className="text-[#8A2BE2] hover:text-purple-400 font-medium">Regístrate ahora</Link>
            </p>
          </div>
        </div>

        {/* Footer acomodado naturalmente en la base */}
        <div className="relative z-10 w-full border-t border-white/5 py-6 bg-black/40 backdrop-blur-sm px-6">
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
    </div>
  );
}