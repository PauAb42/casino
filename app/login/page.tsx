"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Info, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

export default function LoginPage() {
  const router = useRouter();
  
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Estado para manejar nuestra carga y errores simulados
  const [isSimulating, setIsSimulating] = useState(false);
  const [localError, setLocalError] = useState("");

  // 1. Cargar el correo guardado si el usuario usó "Recordarme" antes
  useEffect(() => {
    const savedEmail = localStorage.getItem("royal_casino_email");
    if (savedEmail) {
      setCorreo(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // El navegador valida los campos vacíos automáticamente gracias a "required"
    setLocalError("");
    setIsSimulating(true);

    // 2. Lógica funcional de "Recordarme"
    if (rememberMe) {
      localStorage.setItem("royal_casino_email", correo);
    } else {
      localStorage.removeItem("royal_casino_email");
    }

    // 3. SIMULACIÓN DE LOGIN (Sin Backend real)
    setTimeout(() => {
      setIsSimulating(false);
      
      // Simulamos un error discreto si ponen este correo específico
      if (correo === "error@correo.com") {
        setLocalError("El correo o la contraseña son incorrectos.");
        return;
      }

      // Inyectamos un usuario ficticio en el estado global para que el Navbar lo lea
      useAuthStore.setState({
        user: { 
          participante: { id: "1", alias: correo.split("@")[0], estado: "activo" }, 
          cuenta: { id: "1", rol: "participante" } 
        },
        token: "token-simulado-123",
        error: null
      });

      router.push("/");
    }, 1000); // 1 segundo de carga simulada
  };

  return (
    // CAMBIO: Usamos h-[100dvh] para que ocupe exactamente la pantalla y no haya scroll innecesario.
    <div className="fixed inset-0 z-40 flex flex-col h-[100dvh] bg-[#05050A] text-white overflow-hidden">
      
      {/* Fondo fijo detrás de todo */}
      <div className="absolute inset-0 bg-[url('/fondo.png')] bg-cover bg-center opacity-40 pointer-events-none"></div>
      
      {/* Contenedor central flexible que centra la tarjeta automáticamente */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full px-6">
        
        {/* Tarjeta de Login - Diseño intacto */}
        <div className="bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-[480px]">
          <div className="flex flex-col items-center mb-6">
            <span className="text-[#D4AF37] text-4xl mb-2">♠</span>
            <div className="text-center">
              <span className="block text-[#D4AF37] font-serif text-2xl font-bold leading-none mb-1">ROYAL</span>
              <span className="block text-[#D4AF37] text-xs font-sans tracking-widest uppercase">CASINO</span>
            </div>
            <h1 className="text-2xl font-bold mt-5 mb-1">Bienvenido de nuevo</h1>
            <p className="text-gray-400 text-sm text-center">Inicia sesión para continuar y vivir la emoción</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Correo electrónico o usuario</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className={`w-full bg-[#131722] border ${localError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#8A2BE2]'} rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none transition-colors text-sm`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="•••••••••"
                  className={`w-full bg-[#131722] border ${localError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#8A2BE2]'} rounded-lg py-3 pl-10 pr-10 text-white focus:outline-none transition-colors text-sm`}
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
                  className="w-4 h-4 rounded border-gray-600 text-[#8A2BE2] focus:ring-[#8A2BE2] bg-transparent" 
                />
                <span className="text-gray-300">Recordarme</span>
              </label>
              <Link href="/recuperar" className="text-[#8A2BE2] hover:text-purple-400 transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* ERROR DISCRETO: Altura fija (h-5) para que no brinque el diseño al aparecer */}
            <div className="h-5 flex items-center justify-center mt-1">
              {localError && (
                <p className="text-red-500 text-xs flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle size={14} /> {localError}
                </p>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isSimulating}
              className="w-full bg-[#3B2063] hover:bg-[#4A297C] text-white font-medium py-3.5 rounded-lg transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSimulating ? "Iniciando..." : "INICIAR SESIÓN"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            ¿No tienes una cuenta? <Link href="/registro" className="text-[#8A2BE2] hover:text-purple-400 font-medium">Regístrate ahora</Link>
          </p>
        </div>
      </div>

      {/* Footer garantizado de verse en pantalla reduciendo los py a 4 */}
      <div className="relative z-10 w-full border-t border-white/5 py-4 bg-black/40 backdrop-blur-sm px-6 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-12 gap-y-3">
          <div className="flex items-center gap-3">
            <Info className="text-purple-500" size={20} />
            <div>
              <p className="text-xs font-bold leading-tight">Juego Responsable</p>
              <p className="text-[10px] text-gray-500 leading-tight">Jugamos por diversión</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-purple-500" size={20} />
            <div>
              <p className="text-xs font-bold leading-tight">Licencia Oficial</p>
              <p className="text-[10px] text-gray-500 leading-tight">Operador autorizado</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border border-purple-500 text-purple-500 flex items-center justify-center text-[10px] font-bold">
              18+
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Solo mayores de 18</p>
              <p className="text-[10px] text-gray-500 leading-tight">Juega responsablemente</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}