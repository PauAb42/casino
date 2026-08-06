"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type {
  InventarioDeAlmacenamiento,
  InventarioDeCookies,
  InventarioDeMedios,
  InventarioDeMisDatos,
  InventarioDePermisos,
  ReciboDeBorrado,
} from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import { useLabStore } from "@/lib/labStore";
import { vaciarEventos } from "@/lib/eventos";
import { revocarPermiso } from "@/lib/permisosLab";
import { useZeroTrustStore } from "@/lib/store";

/**
 * El expediente: qué tiene el sitio sobre ti y el botón que lo retira.
 *
 * `GET /mis-datos` y `DELETE /mis-datos` son deliberadamente simétricos —usan la
 * misma función para contar— para que "esto se va a borrar" y "esto se borró"
 * sean comparables campo por campo. Por eso aquí se muestran con las mismas
 * etiquetas y en el mismo orden: un botón de borrado que no puede enseñar su
 * antes es indistinguible de uno que no borra.
 *
 * El bloque `no_se_va` no es relleno legal: la bitácora no se borra (una
 * evidencia que el interesado puede vaciar no demuestra nada) y la huella se
 * recalcula sola en la siguiente visita.
 */

const RISKS = [
  "Un permiso concedido una vez puede seguir activo hasta que tú lo revoques manualmente.",
  "Cámara y micrófono pueden usarse en segundo plano si el sitio no libera el stream.",
  "Las cookies persistentes permiten rastrear tu actividad entre sesiones y sitios.",
  "La ubicación exacta revela patrones de vida: dónde vives, trabajas y te mueves.",
];

const GOOD_PRACTICES = [
  "Lee qué pide el permiso antes de aceptar, no solo el botón.",
  "Revisa periódicamente los permisos activos en la configuración del navegador.",
  "Prefiere 'Permitir una vez' en lugar de 'Permitir siempre' cuando exista la opción.",
  "Como desarrollador: siempre libera streams de cámara/micrófono en cuanto termines de usarlos.",
];

const ETIQUETAS_DE_RECURSO: Record<string, string> = {
  cookies: "Cookies",
  almacenamiento: "Claves de almacenamiento",
  datos_pasivos: "Datos pasivos",
  lecturas_ubicacion: "Lecturas de ubicación",
  activaciones_medios: "Aperturas de cámara/micrófono",
  eventos: "Eventos de navegación",
  resultados: "Resultados de juego",
  respuestas: "Respuestas de concientización",
};

export default function AwarenessDashboard() {
  const { log } = useZeroTrustStore();
  const estado = useAuthStore((s) => s.estado);
  const sesionId = useLabStore((s) => s.sesionId);
  const consentimiento = useLabStore((s) => s.consentimiento);

  const [inventario, setInventario] = useState<InventarioDeMisDatos | null>(null);
  const [permisos, setPermisos] = useState<InventarioDePermisos | null>(null);
  const [cookies, setCookies] = useState<InventarioDeCookies | null>(null);
  const [almacenamiento, setAlmacenamiento] = useState<InventarioDeAlmacenamiento | null>(null);
  const [medios, setMedios] = useState<InventarioDeMedios | null>(null);
  const [recibo, setRecibo] = useState<ReciboDeBorrado | null>(null);
  const [cargando, setCargando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!sesionId) return;
    setCargando(true);
    setError(null);
    try {
      // Se vacía la cola antes de contar: si no, el informe diría menos eventos
      // de los que hay en cuanto se envíe el siguiente lote.
      await vaciarEventos();
      // Cookies con `incluir_eliminadas`: una cookie borrada sigue siendo una
      // fila con su hash en la base, y `mis-datos` la cuenta igual.
      const [misDatos, listaDePermisos, inventarioCookies, inventarioStorage, inventarioMedios] =
        await Promise.all([
          api.misDatos.inventario(sesionId),
          api.permisos.listar(sesionId),
          api.cookies.listar(sesionId, true),
          api.almacenamiento.listar(sesionId),
          api.medios.listar(sesionId),
        ]);
      setInventario(misDatos);
      setPermisos(listaDePermisos);
      setCookies(inventarioCookies);
      setAlmacenamiento(inventarioStorage);
      setMedios(inventarioMedios);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer tu expediente");
    } finally {
      setCargando(false);
    }
  }, [sesionId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const borrarTodo = async () => {
    if (!sesionId) return;
    setBorrando(true);
    try {
      // Es idempotente a propósito y no exige sesión activa: el momento natural
      // de usarlo es el final del recorrido.
      const respuesta = await api.misDatos.borrar(sesionId);
      setRecibo(respuesta);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo borrar");
    } finally {
      setBorrando(false);
    }
  };

  const retirar = async (permisoId: string) => {
    await revocarPermiso(permisoId);
    await cargar();
  };

  const terminarRecorrido = async () => {
    setCerrandoSesion(true);
    try {
      // Se vacía la telemetría pendiente antes de cerrar: después ya no habría
      // sesión activa a la que atribuirla.
      await vaciarEventos();
      await useLabStore.getState().cerrar("finalizada");
    } finally {
      setCerrandoSesion(false);
    }
  };

  const grantedCount = permisos?.resumen.vigentes ?? 0;

  return (
    <section id="panel" className="border-t border-gold/15 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-xs uppercase tracking-widest text-trust">
          Expediente de concientización
        </p>
        <h2 className="mt-2 font-marquee text-4xl text-paper sm:text-5xl">
          Esto es lo que el sitio pudo observar
        </h2>

        {estado !== "autenticado" || !sesionId ? (
          <p className="mt-6 max-w-2xl text-sm text-paper/70">
            Inicia sesión para abrir una sesión de laboratorio: sin ella no hay nada de dónde colgar lo que se
            recolecta, y este panel no tendría qué mostrarte.
          </p>
        ) : (
          <>
            <p className="mt-4 max-w-2xl text-sm text-paper/70">
              Tienes <span className="text-gold">{grantedCount}</span> permiso
              {grantedCount === 1 ? "" : "s"} vigente{grantedCount === 1 ? "" : "s"} sobre tu dispositivo
              {permisos && permisos.resumen.concedidos > permisos.resumen.vigentes && (
                <>
                  {" "}
                  (llegaste a conceder {permisos.resumen.concedidos} y retiraste{" "}
                  {permisos.resumen.revocados})
                </>
              )}
              .
              {permisos && permisos.resumen.concedidos_sin_pensar > 0 && (
                <>
                  {" "}
                  <span className="text-alert">
                    {permisos.resumen.concedidos_sin_pensar} lo concediste en menos de dos segundos.
                  </span>
                </>
              )}
              {consentimiento?.decidio_sin_leer && (
                <> Y aceptaste el aviso de privacidad en {consentimiento.ms_decision} ms.</>
              )}
            </p>

            {error && <p className="mt-4 font-mono text-xs text-alert">{error}</p>}

            {/* Inventario: qué hay y qué se iría */}
            <div className="mt-8 rounded-lg border border-paper/10 bg-felt/60 felt-texture p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-mono text-xs uppercase tracking-widest text-gold">
                  {recibo ? "Lo que se borró" : "Lo que hay guardado ahora"}
                </h3>
                <button
                  onClick={() => void cargar()}
                  disabled={cargando}
                  className="font-mono text-[11px] text-paper/50 hover:text-paper disabled:opacity-40"
                >
                  {cargando ? "Actualizando…" : "Actualizar"}
                </button>
              </div>

              {(() => {
                const conteos = recibo?.borrado ?? inventario?.se_borra;
                if (!conteos) {
                  return <p className="mt-3 font-mono text-xs text-paper/40">Sin datos todavía.</p>;
                }
                return (
                  <>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {Object.entries(ETIQUETAS_DE_RECURSO).map(([clave, etiqueta]) => (
                        <div key={clave} className="rounded-md border border-paper/10 bg-void/40 px-3 py-2">
                          <p className="font-mono text-lg text-paper">
                            {conteos[clave as keyof typeof conteos] as number}
                          </p>
                          <p className="text-[11px] leading-tight text-paper/50">{etiqueta}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 font-mono text-xs text-paper/60">
                      Total: <span className="text-gold">{conteos.total}</span> filas
                      {inventario && !recibo && (
                        <>
                          {" · "}se revocarían {inventario.se_revoca.permisos} permiso
                          {inventario.se_revoca.permisos === 1 ? "" : "s"}
                          {inventario.se_revoca.consentimiento ? " y el consentimiento" : ""}
                        </>
                      )}
                    </p>
                  </>
                );
              })()}

              {recibo && (
                <p className="mt-4 rounded-md border border-trust/30 bg-trust/10 px-4 py-3 text-xs leading-relaxed text-trust">
                  {recibo.lectura}
                </p>
              )}

              {/* Lo que no se va, con su motivo: es la lección, no letra chica. */}
              {(recibo?.no_se_va ?? inventario?.no_se_va ?? []).length > 0 && (
                <div className="mt-4 border-t border-paper/10 pt-4">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-alert">
                    Lo que no se va
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-paper/60">
                    {(recibo?.no_se_va ?? inventario?.no_se_va ?? []).map((entrada) => (
                      <li key={entrada.recurso}>
                        <span className="text-paper/80">{entrada.recurso}</span> — {entrada.motivo}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => void borrarTodo()}
                  disabled={borrando || !inventario}
                  className="rounded-md border border-alert/50 bg-alert/10 px-5 py-2.5 font-mono text-xs font-semibold text-alert transition-colors hover:bg-alert hover:text-void disabled:opacity-40"
                >
                  {borrando ? "Borrando…" : "Revocar y borrar todo lo de esta sesión"}
                </button>

                {/* Último paso del recorrido: `finalizada` y no `abandonada`,
                    porque para el análisis no es lo mismo terminar que irse. */}
                <button
                  onClick={() => void terminarRecorrido()}
                  disabled={cerrandoSesion}
                  className="rounded-md border border-paper/20 px-5 py-2.5 font-mono text-xs text-paper/70 transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
                >
                  {cerrandoSesion ? "Cerrando…" : "Terminar el recorrido"}
                </button>
              </div>
            </div>

            {/* Cookies: el valor no está, solo su hash. Es lo que demuestra que
                el servidor se quedó con la huella y no con el contenido. */}
            {cookies && cookies.cookies.length > 0 && (
              <div className="mt-6 rounded-lg border border-paper/10 bg-felt/60 felt-texture p-5">
                <h3 className="font-mono text-xs uppercase tracking-widest text-gold">
                  Cookies que te dejó el sitio ({cookies.resumen.vigentes} vigentes de {cookies.resumen.total})
                </h3>
                <ul className="mt-3 divide-y divide-paper/10">
                  {cookies.cookies.map((cookie) => (
                    <li key={cookie.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                      <span className="font-mono text-sm text-paper">{cookie.nombre}</span>
                      <span className="rounded bg-paper/10 px-2 py-0.5 font-mono text-[10px] uppercase text-paper/60">
                        {cookie.tipo}
                      </span>
                      {cookie.eliminada_at && (
                        <span className="font-mono text-[10px] uppercase text-paper/30">eliminada</span>
                      )}
                      <span className="w-full text-xs text-paper/50 sm:w-auto sm:flex-1">{cookie.proposito}</span>
                      <span className="font-mono text-[11px] text-paper/30">
                        hash {cookie.valor_hash.slice(0, 12)}…
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Web Storage: auto-declarado. Lo que el cliente no envíe, el
                servidor no lo sabe — a diferencia de las cookies. */}
            {almacenamiento && almacenamiento.entradas.length > 0 && (
              <div className="mt-6 rounded-lg border border-paper/10 bg-felt/60 felt-texture p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-mono text-xs uppercase tracking-widest text-gold">
                    Lo que hay en tu navegador ({almacenamiento.resumen.total} claves)
                  </h3>
                  <span className="font-mono text-[11px] text-paper/40">
                    {almacenamiento.resumen.tecnicas} técnicas · {almacenamiento.resumen.sin_valor_para_ti} que no
                    te sirven a ti
                  </span>
                </div>
                <ul className="mt-3 divide-y divide-paper/10">
                  {almacenamiento.entradas.map((entrada) => (
                    <li key={entrada.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                      <span className="font-mono text-sm text-paper">{entrada.clave}</span>
                      <span className="rounded bg-paper/10 px-2 py-0.5 font-mono text-[10px] uppercase text-paper/60">
                        {entrada.area}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase ${
                          entrada.preocupa ? "bg-alert/15 text-alert" : "bg-trust/15 text-trust"
                        }`}
                      >
                        {entrada.categoria}
                      </span>
                      <span className="w-full text-xs text-paper/50 sm:w-auto sm:flex-1">{entrada.proposito}</span>
                      <span className="font-mono text-[11px] text-paper/30">{entrada.tamano_bytes} B</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] leading-relaxed text-paper/40">
                  Esto no lo observó el servidor: se lo declaró un script del sitio. `localStorage` no viaja en las
                  peticiones, así que lo que un cliente calle, aquí no aparece.
                </p>
              </div>
            )}

            {/* Cámara y micrófono: ni un fotograma guardado, solo el tiempo. */}
            {medios && medios.activaciones.length > 0 && (
              <div className="mt-6 rounded-lg border border-paper/10 bg-felt/60 felt-texture p-5">
                <h3 className="font-mono text-xs uppercase tracking-widest text-gold">
                  Cámara y micrófono ({Math.round(medios.resumen.ms_con_acceso_total / 1000)} s con acceso)
                </h3>
                <p className="mt-2 text-sm text-paper/70">{medios.resumen.lectura}</p>
                <ul className="mt-3 divide-y divide-paper/10">
                  {medios.activaciones.map((activacion) => (
                    <li key={activacion.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                      <span className="font-mono text-sm text-paper">{activacion.pistas.join(" + ")}</span>
                      <span className="rounded bg-paper/10 px-2 py-0.5 font-mono text-[10px] uppercase text-paper/60">
                        {activacion.estado}
                      </span>
                      {activacion.indicador_visible && (
                        <span className="rounded bg-alert/15 px-2 py-0.5 font-mono text-[10px] uppercase text-alert">
                          indicador encendido
                        </span>
                      )}
                      {activacion.paso_desapercibida && (
                        <span className="font-mono text-[11px] text-alert">pasó desapercibida</span>
                      )}
                      <span className="ml-auto font-mono text-[11px] text-paper/40">
                        {Math.round(activacion.duracion_ms / 1000)} s
                        {activacion.ms_hasta_notar !== null &&
                          ` · lo notaste en ${Math.round(activacion.ms_hasta_notar / 1000)} s`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Permisos, uno por uno, con su botón de retirar */}
            {permisos && permisos.permisos.length > 0 && (
              <div className="mt-6 rounded-lg border border-paper/10 bg-felt/60 felt-texture p-5">
                <h3 className="font-mono text-xs uppercase tracking-widest text-gold">
                  Permisos de esta sesión
                </h3>
                <ul className="mt-3 divide-y divide-paper/10">
                  {permisos.permisos.map((permiso) => (
                    <li key={permiso.id} className="flex flex-wrap items-center gap-3 py-2.5">
                      <span className="font-mono text-sm text-paper capitalize">{permiso.tipo}</span>
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase ${
                          permiso.sigue_vigente
                            ? "bg-alert/15 text-alert"
                            : permiso.fue_revocado
                              ? "bg-trust/15 text-trust"
                              : "bg-paper/10 text-paper/60"
                        }`}
                      >
                        {permiso.estado}
                      </span>
                      {permiso.ms_decision !== null && (
                        <span className="font-mono text-[11px] text-paper/40">
                          {permiso.ms_decision} ms
                          {permiso.concedido_sin_pensar && " · sin pensar"}
                        </span>
                      )}
                      {permiso.sigue_vigente && (
                        <button
                          onClick={() => void retirar(permiso.id)}
                          className="ml-auto rounded border border-paper/20 px-3 py-1 font-mono text-[11px] text-paper/70 hover:border-alert hover:text-alert"
                        >
                          Retirar la llave
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-paper/10 bg-felt/60 felt-texture p-5">
            <h3 className="font-mono text-xs uppercase tracking-widest text-alert">
              Riesgos de aceptar sin leer
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-paper/75">
              {RISKS.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-alert">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-paper/10 bg-felt/60 felt-texture p-5">
            <h3 className="font-mono text-xs uppercase tracking-widest text-trust">
              Buenas prácticas
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-paper/75">
              {GOOD_PRACTICES.map((g) => (
                <li key={g} className="flex gap-2">
                  <span className="text-trust">•</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-paper/10 bg-void/60 p-5">
          <h3 className="font-mono text-xs uppercase tracking-widest text-paper/50">
            Bitácora de eventos (en vivo)
          </h3>
          {log.length === 0 ? (
            <p className="mt-3 font-mono text-xs text-paper/40">
              Todavía no hay eventos. Ve al piso de juego y prueba una mesa.
            </p>
          ) : (
            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto font-mono text-xs">
              {log.map((entry) => (
                <li key={entry.id} className="flex flex-wrap gap-x-2 text-paper/70">
                  <span className="text-paper/40">[{entry.timestamp}]</span>
                  <span className={entry.status === "granted" ? "text-trust" : "text-alert"}>
                    {entry.permission}
                  </span>
                  <span>— {entry.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
