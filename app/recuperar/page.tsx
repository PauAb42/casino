"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ShieldCheck, Info, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function RecuperarPage() {
  const [correo, setCorreo] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // El navegador ya validó que el campo tenga formato de correo gracias al "type='email'" y "required"
    setLocalError("");
    setIsSimulating(true);

    // SIMULACIÓN DE ENVÍO DE CORREO (Sin Backend real)
    setTimeout(() => {
      setIsSimulating(false);
      
      // Simulamos un error discreto si ponen este correo específico para pruebas
      if (correo === "error@correo.com") {
        setLocalError("No encontramos ninguna cuenta con ese correo.");
        return;
      }

      // Si todo sale bien, cambiamos al estado de éxito
      setIsSubmitted(true);
    }, 1500); // 1.5 segundos de carga simulada
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col h-[100dvh] bg-[#05050A] text-white overflow-hidden">
      
      {/* Fondo fijo detrás de todo */}
      <div className="absolute inset-0 bg-[url('/fondo.png')] bg-cover bg-center opacity-40 pointer-events-none"></div>
      
      {/* Contenedor central flexible */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full px-6">
        
        {/* Tarjeta de Recuperación */}
        <div className="bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-[480px]">
          
          <div className="flex flex-col items-center mb-6">
            <span className="text-[#D4AF37] text-4xl mb-2">♠</span>
            <div className="text-center">
              <span className="block text-[#D4AF37] font-serif text-2xl font-bold leading-none mb-1">ROYAL</span>
              <span className="block text-[#D4AF37] text-xs font-sans tracking-widest uppercase">CASINO</span>
            </div>
          </div>

          {isSubmitted ? (
            // ESTADO 2: Mensaje de Éxito
            <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Revisa tu correo</h1>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                Hemos enviado un enlace de recuperación a <br/>
                <span className="text-white font-medium">{correo}</span>
              </p>
              
              <Link 
                href="/login" 
                className="w-full bg-[#3B2063] hover:bg-[#4A297C] text-white font-medium py-3.5 rounded-lg transition-colors text-center block"
              >
                VOLVER A INICIAR SESIÓN
              </Link>
            </div>
          ) : (
            // ESTADO 1: Formulario de Correo
            <div className="animate-in fade-in duration-300">
              <h1 className="text-2xl font-bold mb-2 text-center">Recuperar contraseña</h1>
              <p className="text-gray-400 text-sm text-center mb-8">
                Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu acceso.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">Correo electrónico</label>
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
                  {isSimulating ? "ENVIANDO..." : "ENVIAR ENLACE"}
                </button>
              </form>

              <Link 
                href="/login" 
                className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mt-8"
              >
                <ArrowLeft size={16} />
                Volver al inicio de sesión
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer garantizado de verse en pantalla */}
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