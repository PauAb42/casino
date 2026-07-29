"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Gift, Crown, User, Calendar, CheckCircle2 } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function RegistroPage() {
  const router = useRouter();
  
  // Únicos campos permitidos por la BD
  const [alias, setAlias] = useState("");
  const [correo, setCorreo] = useState("");
  const [rangoEdad, setRangoEdad] = useState("");
  const [contrasena, setContrasena] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // El navegador valida los campos "required" automáticamente antes de llegar aquí
    if (!aceptoTerminos) return;
    
    setIsLoading(true);
    setError("");

    try {
      await fetchApi("/auth/registro", {
        method: "POST",
        body: JSON.stringify({
          alias,
          correo,
          rango_edad: rangoEdad,
          contrasena,
        }),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Ocurrió un error al crear la cuenta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // CAMBIO CLAVE: 'fixed inset-0' y 'overflow-y-auto' evitan el margen del layout y habilitan scroll.
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#05050A] text-white">
      
      {/* Fondo fijo detrás de todo, 100% limpio */}
      <div className="fixed inset-0 bg-[url('/fondo.png')] bg-cover bg-center opacity-30 pointer-events-none"></div>
      
      {/* Contenedor flexible que estructura la página */}
      <div className="flex flex-col min-h-full">
        
        {/* flex-1 centra la tarjeta verticalmente si hay espacio en pantalla */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full px-4 py-20">
          
          {/* Contenedor Principal Ancho (Diseño intacto) */}
          <div className="bg-[#0B0E14]/95 backdrop-blur-xl border border-[#3B2063]/30 rounded-3xl shadow-[0_0_50px_rgba(59,32,99,0.15)] w-full max-w-[1000px] flex flex-col md:flex-row overflow-hidden">
            
            {/* Columna Izquierda: Información y Bono */}
            <div className="w-full md:w-[45%] p-8 md:p-10 border-b md:border-b-0 md:border-r border-white/5 bg-gradient-to-br from-[#1E1133]/20 to-transparent flex flex-col justify-between">
              <div>
                <p className="text-[#8A2BE2] text-xs font-bold tracking-widest uppercase mb-2">Únete a Royal Casino</p>
                <h1 className="text-3xl font-bold mb-2">Crea tu cuenta</h1>
                <p className="text-gray-400 text-sm mb-8">Es rápido, seguro y gratis</p>

                {/* Tarjeta de Bono */}
                <div className="bg-[#130A24] border border-[#3B2063] rounded-2xl p-5 mb-8 flex items-center gap-4 relative overflow-hidden">
                  {/* Glow de fondo */}
                  <div className="absolute -left-10 -top-10 w-32 h-32 bg-[#8A2BE2]/20 blur-3xl rounded-full"></div>
                  <div className="w-16 h-16 shrink-0 bg-gradient-to-br from-[#3B2063] to-[#1E1133] rounded-xl flex items-center justify-center border border-white/5 z-10">
                    <Gift size={32} className="text-[#8A2BE2]" />
                  </div>
                  <div className="z-10">
                    <p className="text-[#8A2BE2] text-[10px] font-bold tracking-widest uppercase mb-1">¡Bono de bienvenida!</p>
                    <p className="text-xl font-bold leading-tight">100% <span className="text-sm font-normal text-gray-300">HASTA</span></p>
                    <p className="text-[#D4AF37] text-2xl font-bold leading-tight mb-1">$5,000 MXN</p>
                    <p className="text-xs text-gray-400">+ 200 GIROS GRATIS</p>
                  </div>
                </div>

                {/* Beneficios */}
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <ShieldCheck size={24} className="text-[#8A2BE2] shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-sm mb-1">Seguro y confiable</h3>
                      <p className="text-xs text-gray-400">Tus datos están protegidos con tecnología de encriptación avanzada.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Gift size={24} className="text-[#8A2BE2] shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-sm mb-1">Bonos exclusivos</h3>
                      <p className="text-xs text-gray-400">Accede a promociones especiales para nuevos jugadores.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Crown size={24} className="text-[#8A2BE2] shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-sm mb-1">Experiencia premium</h3>
                      <p className="text-xs text-gray-400">Disfruta de los mejores juegos, torneos y atención 24/7.</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-400 mt-10">
                ¿Ya tienes una cuenta? <Link href="/login" className="text-[#8A2BE2] hover:text-purple-400 transition-colors">Inicia sesión</Link>
              </p>
            </div>

            {/* Columna Derecha: Formulario */}
            <div className="w-full md:w-[55%] p-8 md:p-10">
              {success ? (
                 <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                   <CheckCircle2 size={64} className="text-green-500 mb-4" />
                   <h2 className="text-2xl font-bold mb-2">¡Bienvenido a Royal Casino!</h2>
                   <p className="text-gray-400">Tu cuenta ha sido creada exitosamente. Preparando la redirección...</p>
                 </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  
                  {/* Sección 1: Información personal */}
                  <div>
                    <h3 className="text-sm font-bold text-white mb-4">Información personal</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Alias de jugador</label>
                        <div className="relative">
                          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input 
                            type="text"
                            value={alias}
                            onChange={(e) => setAlias(e.target.value)}
                            placeholder="Ingresa tu alias (ej. JugadorUno)"
                            minLength={3}
                            maxLength={40}
                            className="w-full bg-[#0F111A] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#8A2BE2] transition-colors"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Correo electrónico</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input 
                            type="email"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            placeholder="ejemplo@correo.com"
                            className="w-full bg-[#0F111A] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#8A2BE2] transition-colors"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección 2: Información adicional */}
                  <div>
                    <h3 className="text-sm font-bold text-white mb-4">Información adicional</h3>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Rango de edad</label>
                      <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <select 
                          value={rangoEdad}
                          onChange={(e) => setRangoEdad(e.target.value)}
                          className="w-full bg-[#0F111A] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#8A2BE2] transition-colors appearance-none"
                          required
                        >
                          <option value="" disabled className="text-gray-500">Selecciona tu rango de edad</option>
                          <option value="18-24">18 - 24 años</option>
                          <option value="25-34">25 - 34 años</option>
                          <option value="35-44">35 - 44 años</option>
                          <option value="45-54">45 - 54 años</option>
                          <option value="55-64">55 - 64 años</option>
                          <option value="65+">65 años o más</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <div className="w-2 h-2 border-b-2 border-r-2 border-gray-500 transform rotate-45"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección 3: Seguridad */}
                  <div>
                    <h3 className="text-sm font-bold text-white mb-4">Seguridad</h3>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Contraseña</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                          type={showPassword ? "text" : "password"}
                          value={contrasena}
                          onChange={(e) => setContrasena(e.target.value)}
                          placeholder="Crea una contraseña segura (Min. 10 chars)"
                          minLength={10}
                          className="w-full bg-[#0F111A] border border-white/5 rounded-lg py-2.5 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-[#8A2BE2] transition-colors"
                          required
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {error && <p className="text-red-400 text-sm">{error}</p>}

                  {/* Footer de formulario */}
                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group mb-6">
                      <input 
                        type="checkbox" 
                        checked={aceptoTerminos}
                        onChange={(e) => setAceptoTerminos(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded bg-[#0F111A] border border-white/20 text-[#3B2063] focus:ring-[#3B2063]" 
                        required
                      />
                      <span className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                        Acepto los <Link href="/terminos" className="text-[#8A2BE2]">Términos y Condiciones</Link> y la <Link href="/privacidad" className="text-[#8A2BE2]">Política de Privacidad</Link> y confirmo que soy mayor de 18 años.
                      </span>
                    </label>

                    <button 
                      type="submit" 
                      disabled={isLoading || !aceptoTerminos}
                      className="w-full bg-[#3B2063] hover:bg-[#4A297C] text-white font-medium py-3.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "CREANDO..." : "CREAR MI CUENTA"}
                    </button>
                  </div>

                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}