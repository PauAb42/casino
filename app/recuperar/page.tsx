"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ShieldCheck, Info, ArrowLeft, CheckCircle2, AlertCircle, Lock, Eye, EyeOff } from "lucide-react";
import { ApiError, api } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

/**
 * Recuperación de contraseña, en sus dos fases.
 *
 * Sin `?token=` pide el correo (`POST /auth/recuperacion`); con token, pide la
 * contraseña nueva (`POST /auth/recuperacion/confirmacion`). Es una sola pantalla
 * porque es un solo flujo, y el token llega por el enlace del correo.
 *
 * La primera fase muestra **siempre** el mismo mensaje: el backend responde 202
 * exista o no la cuenta, y contarlo de otra forma en la UI desharía justo la
 * propiedad que ese diseño protege.
 */
export default function RecuperarPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-40 bg-[#05050A]" />}>
      <PantallaDeRecuperacion />
    </Suspense>
  );
}

function PantallaDeRecuperacion() {
  const router = useRouter();
  const parametros = useSearchParams();
  const token = parametros.get("token");

  const politica = useAuthStore((s) => s.politica);
  const cargarPolitica = useAuthStore((s) => s.cargarPolitica);

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [restablecida, setRestablecida] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) void cargarPolitica();
  }, [token, cargarPolitica]);

  const solicitarEnlace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEnviando(true);

    try {
      await api.auth.solicitarRecuperacion(correo);
      // Se muestra lo mismo pase lo que pase: el backend no dice si el correo
      // estaba registrado, y la pantalla tampoco debe insinuarlo.
      setEnviado(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo enviar el enlace. Inténtalo de nuevo.",
      );
    } finally {
      setEnviando(false);
    }
  };

  const restablecer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError("");
    setEnviando(true);

    try {
      await api.auth.restablecerContrasena({ token, contrasena });
      setRestablecida(true);
      // No hay sesión iniciada: cambiar la contraseña y entrar son dos actos
      // distintos, así que se vuelve al login con la clave nueva.
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo restablecer la contraseña. Inténtalo de nuevo.",
      );
    } finally {
      setEnviando(false);
    }
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

          {restablecida ? (
            /* FASE 2 · resuelta */
            <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Contraseña actualizada</h1>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                Ya puedes iniciar sesión con tu contraseña nueva. Te llevamos al inicio de sesión…
              </p>
              <Link
                href="/login"
                className="w-full bg-[#3B2063] hover:bg-[#4A297C] text-white font-medium py-3.5 rounded-lg transition-colors text-center block"
              >
                IR A INICIAR SESIÓN
              </Link>
            </div>
          ) : token ? (
            /* FASE 2 · el enlace trae token: se pide la contraseña nueva */
            <div className="animate-in fade-in duration-300">
              <h1 className="text-2xl font-bold mb-2 text-center">Elige tu contraseña nueva</h1>
              <p className="text-gray-400 text-sm text-center mb-8">
                El enlace es de un solo uso y caduca a los 30 minutos de haberlo pedido.
              </p>

              <form onSubmit={restablecer} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">Contraseña nueva</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type={verContrasena ? "text" : "password"}
                      value={contrasena}
                      onChange={(e) => setContrasena(e.target.value)}
                      placeholder="•••••••••"
                      minLength={politica?.largo_minimo ?? 10}
                      maxLength={politica?.largo_maximo ?? 128}
                      className={`w-full bg-[#131722] border ${error ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-[#8A2BE2]"} rounded-lg py-3 pl-10 pr-10 text-white focus:outline-none transition-colors text-sm`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setVerContrasena(!verContrasena)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {verContrasena ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {politica && <p className="mt-2 text-[11px] text-gray-500">{politica.descripcion}</p>}
                </div>

                <div className="min-h-[1.25rem] flex items-center justify-center mt-1">
                  {error && (
                    <p className="text-red-500 text-xs flex items-center gap-1.5 text-center animate-in fade-in">
                      <AlertCircle size={14} className="shrink-0" /> {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full bg-[#3B2063] hover:bg-[#4A297C] text-white font-medium py-3.5 rounded-lg transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enviando ? "GUARDANDO..." : "GUARDAR CONTRASEÑA"}
                </button>
              </form>

              <Link
                href="/recuperar"
                className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mt-8"
              >
                <ArrowLeft size={16} />
                Pedir otro enlace
              </Link>
            </div>
          ) : enviado ? (
            /* FASE 1 · resuelta. El texto no confirma que la cuenta exista. */
            <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Revisa tu correo</h1>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                Si <span className="text-white font-medium">{correo}</span> tiene una cuenta, le enviamos un enlace
                para restablecer la contraseña. Caduca en 30 minutos y solo sirve una vez.
              </p>

              <Link
                href="/login"
                className="w-full bg-[#3B2063] hover:bg-[#4A297C] text-white font-medium py-3.5 rounded-lg transition-colors text-center block"
              >
                VOLVER A INICIAR SESIÓN
              </Link>
            </div>
          ) : (
            /* FASE 1 · formulario de correo */
            <div className="animate-in fade-in duration-300">
              <h1 className="text-2xl font-bold mb-2 text-center">Recuperar contraseña</h1>
              <p className="text-gray-400 text-sm text-center mb-8">
                Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu acceso.
              </p>

              <form onSubmit={solicitarEnlace} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">Correo electrónico</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className={`w-full bg-[#131722] border ${error ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-[#8A2BE2]"} rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none transition-colors text-sm`}
                      required
                    />
                  </div>
                </div>

                <div className="min-h-[1.25rem] flex items-center justify-center mt-1">
                  {error && (
                    <p className="text-red-500 text-xs flex items-center gap-1.5 text-center animate-in fade-in">
                      <AlertCircle size={14} className="shrink-0" /> {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full bg-[#3B2063] hover:bg-[#4A297C] text-white font-medium py-3.5 rounded-lg transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enviando ? "ENVIANDO..." : "ENVIAR ENLACE"}
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
