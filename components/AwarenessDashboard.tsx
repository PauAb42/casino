"use client";

import { useZeroTrustStore } from "@/lib/store";

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

export default function AwarenessDashboard() {
  const { permissions, log, dataPot } = useZeroTrustStore();
  const grantedCount = Object.values(permissions).filter((s) => s === "granted").length;

  return (
    <section id="panel" className="border-t border-gold/15 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-xs uppercase tracking-widest text-trust">
          Expediente de concientización
        </p>
        <h2 className="mt-2 font-marquee text-4xl text-paper sm:text-5xl">
          Esto es lo que el sitio pudo observar
        </h2>

        <p className="mt-4 max-w-2xl text-sm text-paper/70">
          Durante esta experiencia autorizaste acceso a{" "}
          <span className="text-gold">{grantedCount}</span> recurso
          {grantedCount === 1 ? "" : "s"} de tu dispositivo, acumulando{" "}
          <span className="text-gold">{dataPot} fichas</span> en el pozo de datos.
        </p>

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
