"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { ApiError, api } from "@/lib/api";
import type { Juego, NivelRiesgo, Riesgo } from "@/lib/api";

/**
 * Administración de los catálogos: juegos y riesgos.
 *
 * Los catálogos son **configuración del laboratorio**, no datos del estudio, y
 * por eso solo un admin escribe aquí. Dos reglas del backend se reflejan en la
 * interfaz en vez de esconderse:
 *
 *   - el `slug` de un juego y el `codigo` de un riesgo no se pueden cambiar
 *     (son la referencia pública: cambiarlos rompería enlaces y datos ya
 *     recolectados), así que al editar aparecen bloqueados;
 *   - borrar un juego con resultados responde 409, y el mensaje del backend se
 *     muestra tal cual porque explica exactamente por qué.
 */

const NIVELES: NivelRiesgo[] = ["bajo", "medio", "alto", "critico"];

type Pestana = "juegos" | "riesgos";

const JUEGO_VACIO = {
  slug: "",
  nombre: "",
  descripcion: "",
  tecnologia_demo: "",
  instrucciones_seguridad: "",
  orden: 0,
};

const RIESGO_VACIO = {
  codigo: "",
  categoria: "",
  nivel: "medio" as NivelRiesgo,
  titulo: "",
  descripcion: "",
  recomendacion: "",
};

export default function CatalogosAdmin() {
  const [pestana, setPestana] = useState<Pestana>("juegos");
  const [juegos, setJuegos] = useState<Juego[]>([]);
  const [riesgos, setRiesgos] = useState<Riesgo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [creandoJuego, setCreandoJuego] = useState(false);
  const [nuevoJuego, setNuevoJuego] = useState(JUEGO_VACIO);
  const [creandoRiesgo, setCreandoRiesgo] = useState(false);
  const [nuevoRiesgo, setNuevoRiesgo] = useState(RIESGO_VACIO);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      // `solo_activos` sin declarar: el panel administra también lo desactivado.
      const [catalogoJuegos, catalogoRiesgos] = await Promise.all([
        api.juegos.listar({ limite: 100 }),
        api.riesgos.listar({ limite: 100 }),
      ]);
      setJuegos(catalogoJuegos.juegos);
      setRiesgos(catalogoRiesgos.riesgos);
    } catch (err) {
      setError(err instanceof ApiError ? `${err.message} (${err.codigo})` : "No se pudo cargar el catálogo");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /** Traduce el error del backend, que ya explica el porqué mejor que la UI. */
  const conManejo = async (accion: () => Promise<unknown>, exito: string) => {
    setError(null);
    setAviso(null);
    try {
      await accion();
      setAviso(exito);
      await cargar();
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? `${err.message} (${err.codigo})` : "La operación falló");
      return false;
    }
  };

  const crearJuego = async () => {
    const creado = await conManejo(
      () => api.juegos.crear({ ...nuevoJuego, orden: Number(nuevoJuego.orden) || 0 }),
      `Sala "${nuevoJuego.slug}" añadida al catálogo.`,
    );
    if (creado) {
      setNuevoJuego(JUEGO_VACIO);
      setCreandoJuego(false);
    }
  };

  const crearRiesgo = async () => {
    const creado = await conManejo(
      () => api.riesgos.crear({ ...nuevoRiesgo, codigo: nuevoRiesgo.codigo.toUpperCase() }),
      `Riesgo "${nuevoRiesgo.codigo.toUpperCase()}" añadido al catálogo.`,
    );
    if (creado) {
      setNuevoRiesgo(RIESGO_VACIO);
      setCreandoRiesgo(false);
    }
  };

  const campo =
    "w-full rounded-lg border border-white/10 bg-[#131722] px-3 py-2 text-sm text-white focus:border-[#8A2BE2] focus:outline-none";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["juegos", "riesgos"] as Pestana[]).map((p) => (
          <button
            key={p}
            onClick={() => setPestana(p)}
            className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${
              pestana === p
                ? "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]"
                : "border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => (pestana === "juegos" ? setCreandoJuego((v) => !v) : setCreandoRiesgo((v) => !v))}
          className="ml-auto flex items-center gap-2 rounded-lg border border-[#8A2BE2]/40 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#A78BFA] transition-colors hover:bg-[#8A2BE2]/10"
        >
          {(pestana === "juegos" ? creandoJuego : creandoRiesgo) ? <X size={13} /> : <Plus size={13} />}
          {(pestana === "juegos" ? creandoJuego : creandoRiesgo) ? "Cancelar" : "Añadir"}
        </button>

        <button
          onClick={() => void cargar()}
          disabled={cargando}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 transition-colors hover:text-white disabled:opacity-40"
        >
          <RefreshCw size={13} className={cargando ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">{error}</p>
      )}
      {aviso && (
        <p className="mb-4 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-300">
          <Check size={14} /> {aviso}
        </p>
      )}

      {pestana === "juegos" ? (
        <>
          {creandoJuego && (
            <div className="mb-6 grid gap-3 rounded-xl border border-white/10 bg-[#0F131D] p-5 sm:grid-cols-2">
              <input
                className={campo}
                placeholder="slug (no se podrá cambiar)"
                value={nuevoJuego.slug}
                onChange={(e) => setNuevoJuego({ ...nuevoJuego, slug: e.target.value })}
              />
              <input
                className={campo}
                placeholder="nombre"
                value={nuevoJuego.nombre}
                onChange={(e) => setNuevoJuego({ ...nuevoJuego, nombre: e.target.value })}
              />
              <input
                className={`${campo} sm:col-span-2`}
                placeholder="descripción (mínimo 10 caracteres)"
                value={nuevoJuego.descripcion}
                onChange={(e) => setNuevoJuego({ ...nuevoJuego, descripcion: e.target.value })}
              />
              <input
                className={campo}
                placeholder="tecnología demostrada"
                value={nuevoJuego.tecnologia_demo}
                onChange={(e) => setNuevoJuego({ ...nuevoJuego, tecnologia_demo: e.target.value })}
              />
              <input
                className={campo}
                type="number"
                placeholder="orden"
                value={nuevoJuego.orden}
                onChange={(e) => setNuevoJuego({ ...nuevoJuego, orden: Number(e.target.value) })}
              />
              <input
                className={`${campo} sm:col-span-2`}
                placeholder="instrucciones de seguridad (mínimo 10 caracteres)"
                value={nuevoJuego.instrucciones_seguridad}
                onChange={(e) => setNuevoJuego({ ...nuevoJuego, instrucciones_seguridad: e.target.value })}
              />
              <button
                onClick={() => void crearJuego()}
                className="rounded-lg bg-[#3B2063] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#4A297C] sm:col-span-2"
              >
                Crear sala
              </button>
            </div>
          )}

          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-[#131722]/50 text-[11px] uppercase tracking-widest text-[#D4AF37]">
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Tecnología</th>
                <th className="px-4 py-3">Orden</th>
                <th className="px-4 py-3">Activo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {juegos.map((juego) => (
                <tr key={juego.id} className="hover:bg-white/[0.03]">
                  {/* Bloqueado a propósito: es la referencia pública. */}
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{juego.slug}</td>
                  <td className="px-4 py-3 text-gray-200">{juego.nombre}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{juego.tecnologia_demo}</td>
                  <td className="px-4 py-3 font-mono text-gray-400">{juego.orden}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        void conManejo(
                          () => api.juegos.actualizar(juego.id, { activo: !juego.activo }),
                          `"${juego.slug}" ahora está ${juego.activo ? "oculta" : "visible"}.`,
                        )
                      }
                      className={`rounded-lg border px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                        juego.activo
                          ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                          : "border-white/10 text-gray-500 hover:bg-white/5"
                      }`}
                    >
                      {juego.activo ? "activo" : "oculto"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() =>
                        void conManejo(
                          () => api.juegos.eliminar(juego.id),
                          `"${juego.slug}" se eliminó del catálogo.`,
                        )
                      }
                      title="Eliminar del catálogo"
                      className="text-gray-600 transition-colors hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <>
          {creandoRiesgo && (
            <div className="mb-6 grid gap-3 rounded-xl border border-white/10 bg-[#0F131D] p-5 sm:grid-cols-2">
              <input
                className={campo}
                placeholder="CÓDIGO (no se podrá cambiar)"
                value={nuevoRiesgo.codigo}
                onChange={(e) => setNuevoRiesgo({ ...nuevoRiesgo, codigo: e.target.value })}
              />
              <input
                className={campo}
                placeholder="categoría"
                value={nuevoRiesgo.categoria}
                onChange={(e) => setNuevoRiesgo({ ...nuevoRiesgo, categoria: e.target.value })}
              />
              <select
                className={`${campo} appearance-none [&>option]:bg-[#131722]`}
                value={nuevoRiesgo.nivel}
                onChange={(e) => setNuevoRiesgo({ ...nuevoRiesgo, nivel: e.target.value as NivelRiesgo })}
              >
                {NIVELES.map((nivel) => (
                  <option key={nivel} value={nivel}>
                    {nivel}
                  </option>
                ))}
              </select>
              <input
                className={campo}
                placeholder="título"
                value={nuevoRiesgo.titulo}
                onChange={(e) => setNuevoRiesgo({ ...nuevoRiesgo, titulo: e.target.value })}
              />
              <input
                className={`${campo} sm:col-span-2`}
                placeholder="descripción"
                value={nuevoRiesgo.descripcion}
                onChange={(e) => setNuevoRiesgo({ ...nuevoRiesgo, descripcion: e.target.value })}
              />
              <input
                className={`${campo} sm:col-span-2`}
                placeholder="recomendación"
                value={nuevoRiesgo.recomendacion}
                onChange={(e) => setNuevoRiesgo({ ...nuevoRiesgo, recomendacion: e.target.value })}
              />
              <button
                onClick={() => void crearRiesgo()}
                className="rounded-lg bg-[#3B2063] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#4A297C] sm:col-span-2"
              >
                Crear riesgo
              </button>
            </div>
          )}

          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-[#131722]/50 text-[11px] uppercase tracking-widest text-[#D4AF37]">
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Nivel</th>
                <th className="px-4 py-3">Grave</th>
                <th className="px-4 py-3">Activo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {riesgos.map((riesgo) => (
                <tr key={riesgo.id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{riesgo.codigo}</td>
                  <td className="px-4 py-3 text-gray-200">{riesgo.titulo}</td>
                  <td className="px-4 py-3">
                    <select
                      value={riesgo.nivel}
                      onChange={(e) =>
                        void conManejo(
                          () => api.riesgos.actualizar(riesgo.id, { nivel: e.target.value as NivelRiesgo }),
                          `"${riesgo.codigo}" ahora es de nivel ${e.target.value}.`,
                        )
                      }
                      className="rounded-lg border border-white/10 bg-[#131722] px-2 py-1 text-xs text-gray-300 [&>option]:bg-[#131722]"
                    >
                      {NIVELES.map((nivel) => (
                        <option key={nivel} value={nivel}>
                          {nivel}
                        </option>
                      ))}
                    </select>
                  </td>
                  {/* Derivado del nivel por el backend: el panel no lo decide. */}
                  <td className="px-4 py-3">
                    <span className={riesgo.es_grave ? "text-red-400" : "text-gray-500"}>
                      {riesgo.es_grave ? "sí" : "no"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        void conManejo(
                          () => api.riesgos.actualizar(riesgo.id, { activo: !riesgo.activo }),
                          `"${riesgo.codigo}" ahora está ${riesgo.activo ? "oculto" : "visible"}.`,
                        )
                      }
                      className={`rounded-lg border px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                        riesgo.activo
                          ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                          : "border-white/10 text-gray-500 hover:bg-white/5"
                      }`}
                    >
                      {riesgo.activo ? "activo" : "oculto"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() =>
                        void conManejo(
                          () => api.riesgos.eliminar(riesgo.id),
                          `"${riesgo.codigo}" se eliminó del catálogo.`,
                        )
                      }
                      title="Eliminar del catálogo"
                      className="text-gray-600 transition-colors hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
