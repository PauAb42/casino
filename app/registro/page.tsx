"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Gift, Crown, User, Calendar, CheckCircle2, X } from "lucide-react";

export default function RegistroPage() {
  const router = useRouter();
  
  // Estados de formulario
  const [alias, setAlias] = useState("");
  const [correo, setCorreo] = useState("");
  const [rangoEdad, setRangoEdad] = useState("");
  const [contrasena, setContrasena] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  
  // Estados de carga y éxito
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Estados para las ventanas emergentes (Modales)
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; type: "terminos" | "privacidad" | null }>({
    isOpen: false,
    type: null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aceptoTerminos) return;
    
    setIsLoading(true);
    setError("");

    // SIMULACIÓN DE REGISTRO (Sin Backend real)
    setTimeout(() => {
      setIsLoading(false);
      
      if (alias === "ErrorUser") {
        setError("Este alias ya está en uso. Por favor, elige otro.");
        return;
      }

      setSuccess(true);
      
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }, 1500); 
  };

  const closeModal = () => setModalConfig({ isOpen: false, type: null });

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#05050A] text-white">
      
      <div className="fixed inset-0 bg-[url('/fondo.png')] bg-cover bg-center opacity-30 pointer-events-none"></div>
      
      <div className="flex flex-col min-h-full">
        
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full px-4 py-20">
          
          <div className="bg-[#0B0E14]/95 backdrop-blur-xl border border-[#3B2063]/30 rounded-3xl shadow-[0_0_50px_rgba(59,32,99,0.15)] w-full max-w-[1000px] flex flex-col md:flex-row overflow-hidden">
            
            {/* Columna Izquierda: Información y Bono */}
            <div className="w-full md:w-[45%] p-8 md:p-10 border-b md:border-b-0 md:border-r border-white/5 bg-gradient-to-br from-[#1E1133]/20 to-transparent flex flex-col justify-between">
              <div>
                <p className="text-[#8A2BE2] text-xs font-bold tracking-widest uppercase mb-2">Únete a Royal Casino</p>
                <h1 className="text-3xl font-bold mb-2">Crea tu cuenta</h1>
                <p className="text-gray-400 text-sm mb-8">Es rápido, seguro y gratis</p>

                <div className="bg-[#130A24] border border-[#3B2063] rounded-2xl p-5 mb-8 flex items-center gap-4 relative overflow-hidden">
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
                        Acepto los <button type="button" onClick={(e) => { e.preventDefault(); setModalConfig({ isOpen: true, type: "terminos" }); }} className="text-[#8A2BE2] hover:underline">Términos y Condiciones</button> y la <button type="button" onClick={(e) => { e.preventDefault(); setModalConfig({ isOpen: true, type: "privacidad" }); }} className="text-[#8A2BE2] hover:underline">Política de Privacidad</button> y confirmo que soy mayor de 18 años.
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

      {/* MODAL EMERGENTE PARA DOCUMENTOS LEGALES */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0F111A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                {modalConfig.type === "terminos" ? "Términos y Condiciones" : "Política de Privacidad"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Contenido del Modal (Scrollable) */}
            <div className="p-6 overflow-y-auto text-sm text-gray-300 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
              {modalConfig.type === "terminos" ? (
                <>
                  <p><strong>1. Aceptación de los términos</strong><br/>Al acceder y utilizar los servicios de Royal Casino, usted acepta estar sujeto a estos términos y condiciones. Si no está de acuerdo con alguna parte, no debe utilizar nuestros servicios.</p>
                  <p><strong>2. Elegibilidad</strong><br/>Debe tener al menos 18 años de edad para registrarse y jugar. Es su responsabilidad asegurarse de que el juego en línea sea legal en su jurisdicción.</p>
                  <p><strong>3. Cuentas de usuario</strong><br/>Solo se permite una cuenta por persona. Royal Casino se reserva el derecho de suspender o cerrar cuentas duplicadas y confiscar los fondos asociados.</p>
                  
                  {/* SECCIÓN AÑADIDA: El recorrido y los permisos */}
                  <div className="bg-[#1E1133]/30 border border-[#8A2BE2]/20 p-5 rounded-xl">
                    <p className="mb-3 text-[#D4AF37] font-bold">4. Acceso a Zonas y Permisos del Sistema</p>
                    <p className="mb-3">Para garantizar una experiencia inmersiva, funciones de seguridad KYC y verificar restricciones regionales, el recorrido por las zonas de nuestro casino requiere que el jugador otorgue ciertos permisos en su dispositivo:</p>
                    
                    <ul className="space-y-2">
                      <li className="flex justify-between border-b border-white/5 pb-1">
                        <span className="font-medium text-white">0. Lobby</span>
                        <span className="text-gray-400">Requiere Cookies</span>
                      </li>
                      <li className="flex justify-between border-b border-white/5 pb-1">
                        <span className="font-medium text-white">1. Tragamonedas</span>
                        <span className="text-gray-400">Nada (acceso gratis)</span>
                      </li>
                      <li className="flex justify-between border-b border-white/5 pb-1">
                        <span className="font-medium text-white">2. Ruleta</span>
                        <span className="text-gray-400">Requiere Notificaciones</span>
                      </li>
                      <li className="flex justify-between border-b border-white/5 pb-1">
                        <span className="font-medium text-white">3. Rasca y Gana</span>
                        <span className="text-gray-400">Nada</span>
                      </li>
                      <li className="flex justify-between border-b border-white/5 pb-1">
                        <span className="font-medium text-white">4. Blackjack VIP</span>
                        <span className="text-gray-400">Requiere Ubicación</span>
                      </li>
                      <li className="flex justify-between border-b border-white/5 pb-1">
                        <span className="font-medium text-white">5. Mesa en Vivo</span>
                        <span className="text-gray-400">Requiere Micrófono</span>
                      </li>
                      <li className="flex justify-between border-b border-white/5 pb-1">
                        <span className="font-medium text-white">6. Caja / Retiro</span>
                        <span className="text-gray-400">Requiere Cámara</span>
                      </li>
                      <li className="flex justify-between pt-1">
                        <span className="font-medium text-[#D4AF37]">7. Sala VIP</span>
                        <span className="text-[#D4AF37]">(Los 5 anteriores)</span>
                      </li>
                    </ul>
                    <p className="mt-3 text-xs text-gray-400">Al aceptar estos términos, usted comprende que el acceso a dichas zonas está estrictamente condicionado a la concesión de estos permisos de navegador o dispositivo.</p>
                  </div>

                  <p><strong>5. Juego Responsable</strong><br/>Ofrecemos herramientas para ayudar a controlar el juego, incluyendo límites de depósito y autoexclusión. Recomendamos jugar por diversión y nunca gastar más de lo que puede permitirse perder.</p>
                </>
              ) : (
                <>
                  <p><strong>1. Recopilación de información</strong><br/>Recopilamos información personal proporcionada durante el registro, como su alias, correo electrónico y rango de edad, así como datos técnicos relacionados con su dispositivo y uso del sitio.</p>
                  
                  <p><strong>2. Permisos y Datos del Dispositivo</strong><br/>Dependiendo de las áreas a las que acceda dentro de la plataforma, podremos solicitar y recopilar información en tiempo real a través de los permisos de su dispositivo, incluyendo, pero no limitándose a: <strong>ubicación geográfica, acceso al micrófono, cámara y notificaciones push.</strong> Esta información se utiliza exclusivamente para validar la seguridad de retiros en Caja, restricciones de mesas VIP y asegurar la integridad del juego.</p>
                  
                  <p><strong>3. Uso de la información</strong><br/>Utilizamos sus datos para gestionar su cuenta, procesar transacciones, asegurar la legalidad del acceso por región, mejorar nuestros servicios y enviarle comunicaciones promocionales (si ha dado su consentimiento).</p>
                  <p><strong>4. Protección de datos</strong><br/>Implementamos medidas de seguridad técnicas y organizativas para proteger su información contra acceso no autorizado, alteración o divulgación.</p>
                  <p><strong>5. Sus derechos</strong><br/>Usted tiene derecho a acceder, corregir o revocar los permisos otorgados en su dispositivo en cualquier momento mediante la configuración de su navegador, así como solicitar la eliminación de su cuenta a nuestro equipo de soporte.</p>
                </>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="p-6 border-t border-white/10 flex justify-end bg-[#0B0E14]">
              <button 
                onClick={closeModal}
                className="bg-[#3B2063] hover:bg-[#4A297C] text-white px-6 py-2 rounded-lg transition-colors font-medium text-sm"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}