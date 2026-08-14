"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck, FileText, Shield, Info,
  Fingerprint, HardDrive, Globe, Monitor,
  Cpu, ChevronRight, CheckCircle2, Clock,
  AppWindow, Server, Cookie, RefreshCw, Languages, Wifi
} from "lucide-react";
import { ApiError, api } from "@/lib/api";
import type { InformeDeInferencia, SenalPasiva } from "@/lib/api";
import { senalesDelCliente } from "@/lib/fingerprint";
import { useLabStore } from "@/lib/labStore";

/**
 * "Esto es lo que supimos de ti sin pedirte permiso."
 *
 * Se alimenta de `POST /inferencia-pasiva`, el único endpoint público de la
 * captura, y por una razón estructural: mirar no es recolectar. El backend
 * calcula el informe con lo que la petición ya traía y lo descarta al responder
 * — no toca una sola fila —, así que esta pantalla se puede ver sin cuenta,
 * sin sesión y sin consentimiento.
 *
 * El riesgo no lo inventa el front: sale de `requiere_permiso` y de la entropía
 * que cada señal aporta a la huella.
 */

type Riesgo = "ALTO" | "MEDIO" | "BAJO" | "NINGUNO";

const ICONOS: Record<string, React.ElementType> = {
  user_agent: Globe,
  navegador: Globe,
  sistema_operativo: AppWindow,
  plataforma: AppWindow,
  resolucion: Monitor,
  profundidad_color: Monitor,
  nucleos_cpu: Cpu,
  memoria_gb: Server,
  zona_horaria: Clock,
  desfase_utc_minutos: Clock,
  idioma: Languages,
  idiomas: Languages,
  ip: Wifi,
  cookies: Cookie,
  canvas: Fingerprint,
  gpu: HardDrive,
};

function iconoDe(clave: string): React.ElementType {
  if (ICONOS[clave]) return ICONOS[clave];
  const parcial = Object.keys(ICONOS).find((k) => clave.includes(k));
  return parcial ? ICONOS[parcial] : Fingerprint;
}

/**
 * Riesgo derivado de la propia señal.
 *
 * La entropía en bits es cuánto reduce el conjunto de personas que podrías ser:
 * a más bits, más te distingue del resto. Un valor que no requirió permiso y
 * aun así aporta mucha entropía es exactamente el problema del fingerprinting.
 */
function riesgoDe(senal: SenalPasiva): Riesgo {
  if (senal.entropia_bits >= 4) return "ALTO";
  if (senal.entropia_bits >= 2) return "MEDIO";
  if (senal.entropia_bits > 0) return "BAJO";
  return "NINGUNO";
}

export default function VigilanciaPage() {
  const [loading, setLoading] = useState(true);
  const [informe, setInforme] = useState<InformeDeInferencia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reconocidoSinCookies = useLabStore((s) => s.reconocidoSinCookies);
  const huella = useLabStore((s) => s.huella);
  const sesionId = useLabStore((s) => s.sesionId);
  const consentimiento = useLabStore((s) => s.consentimiento);

  const [guardando, setGuardando] = useState(false);
  const [avisoDeGuardado, setAvisoDeGuardado] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;

    (async () => {
      try {
        // El cuerpo lleva las señales que solo el navegador conoce; la otra
        // mitad del informe sale de las cabeceras de esta misma petición.
        const respuesta = await api.inferenciaPasiva.informe(senalesDelCliente());
        if (vivo) setInforme(respuesta);
      } catch (err) {
        if (vivo) setError(err instanceof Error ? err.message : "No se pudo calcular el informe");
      } finally {
        if (vivo) setLoading(false);
      }
    })();

    return () => {
      vivo = false;
    };
  }, []);

  /**
   * Pasa el informe de "mirar" a "recolectar".
   *
   * `/inferencia-pasiva` no guarda nada: el informe se calcula y se descarta. Si
   * el participante quiere ver qué se siente que lo guarden, esto reenvía las
   * mismas señales a `POST /datos-pasivos` —las claves y categorías coinciden a
   * propósito— y ahí sí quedan filas. Exige consentimiento aceptado y vigente:
   * sin base legal el backend responde 422, y ese 422 también es la lección.
   */
  const conservarEnMiExpediente = async () => {
    if (!sesionId || !informe) return;
    setGuardando(true);
    setAvisoDeGuardado(null);

    try {
      let guardadas = 0;
      let hasheadas = 0;
      for (const senal of informe.senales) {
        const respuesta = await api.datosPasivos.capturar({
          sesion_id: sesionId,
          categoria: senal.categoria,
          clave: senal.clave,
          valor: senal.valor.slice(0, 2000),
        });
        guardadas += 1;
        if (respuesta.valor_hasheado) hasheadas += 1;
      }
      setAvisoDeGuardado(
        `Se guardaron ${guardadas} señales en tu expediente. ${hasheadas} se hashearon automáticamente ` +
          `por ser sensibles: el servidor no conserva su valor en claro. Puedes borrarlas todas desde el panel de permisos.`,
      );
    } catch (err) {
      setAvisoDeGuardado(
        err instanceof ApiError
          ? `${err.message} (código ${err.codigo})`
          : "No se pudieron guardar las señales",
      );
    } finally {
      setGuardando(false);
    }
  };

  const senales = informe?.senales ?? [];
  const conRiesgo = senales.filter((s) => riesgoDe(s) !== "NINGUNO");
  const totalAlto = senales.filter((s) => riesgoDe(s) === "ALTO").length;
  const totalMedio = senales.filter((s) => riesgoDe(s) === "MEDIO").length;
  const totalBajo = senales.filter((s) => riesgoDe(s) === "BAJO").length;

  return (
    <div className="min-h-screen bg-[#080B14] text-white font-sans pb-20 selection:bg-[#8A2BE2]/30">

      <main className="max-w-[1100px] mx-auto px-4 lg:px-8 pt-10">

        {/* Título Principal */}
        <h1 className="text-4xl md:text-5xl lg:text-[54px] font-black leading-tight tracking-tight mb-10 text-white">
          Esto es lo que supimos de ti <br />
          <span className="text-[#D4AF37]">sin pedirte permiso</span>
        </h1>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-70 bg-[#121624] rounded-2xl border border-white/5">
            <RefreshCw size={32} className="text-[#A78BFA] animate-spin mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Cargando expediente...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        ) : informe ? (
          <>
            <div className="bg-[#121624] border border-white/5 rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">

              {/* COLUMNA IZQUIERDA (Detalles y Riesgos) */}
              <div className="flex-1 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-white/5">

                {/* Stats Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[auto_1px_auto_1px_1fr] items-center gap-x-8 gap-y-5 mb-8 pb-8 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#1C1A3A] rounded-full flex items-center justify-center border border-[#8A2BE2]/20">
                      <FileText size={20} className="text-[#A78BFA]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-3xl font-black leading-none">{informe.resumen.total}</span>
                      <span className="text-xs text-gray-400 mt-1 whitespace-nowrap">datos capturados</span>
                    </div>
                  </div>

                  <div className="hidden xl:block w-px h-12 bg-white/5" />

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#3A2218] rounded-full flex items-center justify-center border border-orange-500/20">
                      <ShieldCheck size={20} className="text-orange-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-3xl font-black leading-none">{conRiesgo.length}</span>
                      <span className="text-xs text-gray-400 mt-1 whitespace-nowrap">con riesgo</span>
                    </div>
                  </div>

                  <div className="hidden xl:block w-px h-12 bg-white/5" />

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 via-yellow-500/20 to-green-500/20 rounded-full flex items-center justify-center border border-white/10">
                      <Shield size={20} className="text-white" />
                    </div>
                    <div className="text-sm font-medium whitespace-nowrap">
                      <span className="text-red-400">{totalAlto} alto</span>
                      <span className="text-gray-500 mx-1.5">·</span>
                      <span className="text-yellow-400">{totalMedio} medios</span>
                      <span className="text-gray-500 mx-1.5">·</span>
                      <span className="text-green-400">{totalBajo} bajos</span>
                    </div>
                  </div>
                </div>

                {/* La cifra que resume el ejercicio: cuánta gente comparte tu perfil. */}
                <div className="flex items-start gap-3 text-sm text-gray-400 mb-6">
                  <Info size={16} className="text-gray-500 shrink-0 mt-0.5" />
                  <p>
                    {informe.resumen.sin_permiso} de {informe.resumen.total} señales llegaron{" "}
                    <span className="text-orange-400">sin pedirte un solo permiso</span>. Juntas suman{" "}
                    <span className="text-white">{informe.resumen.entropia_bits.toFixed(1)} bits</span> de entropía:{" "}
                    {informe.resumen.nota_entropia}
                  </p>
                </div>

                {/* Lista de Riesgos */}
                <div className="space-y-2 mb-2">
                  {conRiesgo.map((senal) => {
                    const riesgo = riesgoDe(senal);
                    const isAlto = riesgo === "ALTO";
                    const isMedio = riesgo === "MEDIO";
                    const Icon = iconoDe(senal.clave);

                    return (
                      <div key={senal.clave} className="group flex items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-white/5 transition-colors cursor-default">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-white/5 ${
                          isAlto ? "text-red-400" : isMedio ? "text-yellow-400" : "text-green-400"
                        }`}>
                          <Icon size={20} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-white mb-0.5 capitalize">
                            {senal.clave.replace(/_/g, " ")}
                          </h4>
                          <p className="text-sm text-gray-400 line-clamp-2 leading-snug">{senal.revela}</p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span className="hidden sm:block font-mono text-[11px] text-gray-500">
                            {senal.entropia_bits.toFixed(1)} bits
                          </span>
                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-bold tracking-wide ${
                            isAlto ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            isMedio ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                            "bg-green-500/10 text-green-400 border-green-500/20"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isAlto ? "bg-red-400" : isMedio ? "bg-yellow-400" : "bg-green-400"}`}></span>
                            {riesgo}
                          </div>
                          <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* COLUMNA DERECHA (Lista Completa Simple) */}
              <div className="w-full lg:w-[320px] bg-[#0F121C] p-6 lg:p-8 flex flex-col">
                <h3 className="text-[#A78BFA] font-bold text-lg mb-6">Datos capturados</h3>

                <div className="space-y-4 flex-1">
                  {senales.map((senal) => {
                    const Icon = iconoDe(senal.clave);
                    return (
                      <div key={`resumen-${senal.clave}`} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 text-gray-400 group-hover:text-white transition-colors min-w-0">
                          <Icon size={16} className="shrink-0" />
                          <span className="text-sm truncate capitalize" title={senal.valor}>
                            {senal.clave.replace(/_/g, " ")}
                          </span>
                        </div>
                        <CheckCircle2 size={16} className="text-green-500/80 shrink-0" />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3 text-gray-400">
                  <span className="text-sm">Total:</span>
                  <span className="text-xl font-bold text-[#A78BFA]">{informe.resumen.total}</span>
                  <span className="text-sm">datos</span>
                </div>
              </div>

            </div>

            {/* Lo que dedujo de todo eso, que nadie le entregó */}
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/5 bg-[#121624] p-6">
                <h3 className="text-[#A78BFA] font-bold mb-4">Lo que se dedujo, no lo que entregaste</h3>
                <dl className="space-y-3 text-sm">
                  <Dato titulo="Navegador" valor={`${informe.inferencia.navegador} · ${informe.inferencia.motor}`} />
                  <Dato
                    titulo="Sistema operativo"
                    valor={[informe.inferencia.sistema_operativo.nombre, informe.inferencia.sistema_operativo.version]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  <Dato titulo="Dispositivo" valor={informe.inferencia.dispositivo.tipo} />
                  <Dato titulo="Región probable" valor={informe.inferencia.region.lectura} />
                  {informe.inferencia.red && (
                    <Dato
                      titulo="Red"
                      valor={`${informe.inferencia.red.familia} · huella ${informe.inferencia.red.ip_hash_prefijo}${
                        informe.inferencia.red.via_proxy ? " · vía proxy" : ""
                      }`}
                    />
                  )}
                </dl>
                {informe.inferencia.notas.length > 0 && (
                  <ul className="mt-4 space-y-1 text-xs text-gray-500">
                    {informe.inferencia.notas.map((nota) => (
                      <li key={nota}>· {nota}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#121624] p-6">
                <h3 className="text-[#A78BFA] font-bold mb-4">Tu huella de dispositivo</h3>
                {huella ? (
                  <div className="space-y-3 text-sm text-gray-300">
                    <p>
                      Prefijo de tu huella: <span className="font-mono text-white">{huella.hash_huella_prefijo}</span>
                    </p>
                    <p>
                      Visitas registradas con este mismo dispositivo:{" "}
                      <span className="font-bold text-white">{huella.visitas}</span>
                    </p>
                    {reconocidoSinCookies && (
                      <p className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4 text-[#D4AF37]">
                        Ya habíamos visto este dispositivo antes — <strong>sin una sola cookie de por medio</strong>.
                        Borrarlas no te vuelve anónimo.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Inicia sesión para abrir una sesión de laboratorio: ahí es donde se registra la huella y se
                    cuenta si este dispositivo ya había estado aquí.
                  </p>
                )}
                <p className="mt-6 text-xs leading-relaxed text-gray-500">{informe.aviso}</p>
              </div>
            </div>

            {/* La frontera entre mirar y recolectar, con un botón en medio. */}
            <div className="mt-8 rounded-2xl border border-[#D4AF37]/25 bg-[#17130B]/60 p-6">
              <h3 className="mb-2 font-bold text-[#D4AF37]">Hasta aquí, nada de esto se guardó</h3>
              <p className="mb-5 max-w-3xl text-sm leading-relaxed text-gray-400">
                Este informe se calculó con lo que tu navegador ya traía en la petición y se descartó al
                responder: no hay una sola fila en la base de datos. Mirar no es recolectar. Si quieres ver la
                diferencia, guárdalo en tu expediente y después revisa cuánto aparece —y bórralo— desde el panel
                de permisos.
              </p>

              {sesionId ? (
                <button
                  onClick={() => void conservarEnMiExpediente()}
                  disabled={guardando}
                  className="rounded-xl border border-[#D4AF37]/40 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/10 disabled:opacity-40"
                >
                  {guardando ? "Guardando…" : "Conservar estas señales en mi expediente"}
                </button>
              ) : (
                <p className="text-xs text-gray-500">
                  Inicia sesión para tener una sesión de laboratorio donde guardarlas.
                </p>
              )}

              {sesionId && !consentimiento?.esta_vigente && (
                <p className="mt-3 text-xs text-gray-500">
                  Sin consentimiento aceptado y vigente el backend rechazará la captura con un 422: es la regla
                  que vuelve al aviso de privacidad algo más que un adorno.
                </p>
              )}

              {avisoDeGuardado && (
                <p className="mt-4 rounded-xl border border-white/10 bg-[#0F121C] px-4 py-3 text-sm text-gray-300">
                  {avisoDeGuardado}
                </p>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
      <dt className="text-gray-500">{titulo}</dt>
      <dd className="text-right text-white">{valor || "—"}</dd>
    </div>
  );
}
