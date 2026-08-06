"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, Library, Lock, RefreshCw, ScrollText, Users } from "lucide-react";
import CatalogosAdmin from "@/components/panel/CatalogosAdmin";
import { ApiError, api } from "@/lib/api";
import type { EntradaDeAuditoria, HuellaDelEstudio, Paginacion, Rol, UsuarioDelPadron } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

/**
 * Panel del estudio: el lado de la API que el participante nunca ve.
 *
 * Las tres pestañas tienen exigencias distintas y el propio backend las impone,
 * así que aquí solo se refleja quién puede pedir qué:
 *
 *   usuarios   — investigador o admin
 *   huellas    — investigador o admin (nunca el hash completo, solo su prefijo)
 *   auditoría  — solo admin (un investigador analiza el estudio, no la
 *                actividad administrativa)
 *
 * El menú oculta lo que no corresponde, pero eso es cortesía: si alguien llega
 * igual, la respuesta 403 del backend es la que manda y se muestra tal cual.
 */

type Pestana = "usuarios" | "huellas" | "auditoria" | "catalogos";

export default function PanelDelEstudio() {
  const router = useRouter();
  const estado = useAuthStore((s) => s.estado);
  const cuenta = useAuthStore((s) => s.cuenta);
  const rol = cuenta?.rol;

  const [pestana, setPestana] = useState<Pestana>("usuarios");
  const [usuarios, setUsuarios] = useState<UsuarioDelPadron[]>([]);
  const [huellas, setHuellas] = useState<HuellaDelEstudio[]>([]);
  const [auditoria, setAuditoria] = useState<EntradaDeAuditoria[]>([]);
  const [paginacion, setPaginacion] = useState<Paginacion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (estado === "anonimo") router.replace("/login");
  }, [estado, router]);

  const puedeConsultar = rol === "admin" || rol === "investigador";
  const esAdmin = rol === "admin";

  const cargar = useCallback(async () => {
    if (!puedeConsultar) return;
    setCargando(true);
    setError(null);

    try {
      // Los catálogos se administran en su propio componente, que carga lo suyo.
      if (pestana === "catalogos") {
        setPaginacion(null);
        return;
      }

      if (pestana === "usuarios") {
        const datos = await api.usuarios.padron({ limite: 50 });
        setUsuarios(datos.usuarios);
        setPaginacion(datos.paginacion);
      } else if (pestana === "huellas") {
        const datos = await api.huellas.listar({ limite: 50 });
        setHuellas(datos.huellas);
        setPaginacion(datos.paginacion);
      } else {
        const datos = await api.auditoria.listar({ limite: 50 });
        setAuditoria(datos.entradas);
        setPaginacion(datos.paginacion);
      }
    } catch (err) {
      setError(err instanceof ApiError ? `${err.message} (${err.codigo})` : "No se pudo consultar");
    } finally {
      setCargando(false);
    }
  }, [pestana, puedeConsultar]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Las dos rutas de admin toman el id del **participante**, no el de la cuenta.

  /** Cambia el rol: surte efecto en la siguiente petición del afectado. */
  const cambiarRol = async (participanteId: string, nuevoRol: Rol) => {
    try {
      await api.usuarios.cambiarRol(participanteId, nuevoRol);
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar el rol");
    }
  };

  /** Desactivar bloquea el login y las peticiones autenticadas al instante. */
  const cambiarEstadoDeCuenta = async (participanteId: string, activa: boolean) => {
    try {
      await api.usuarios.cambiarEstado(participanteId, activa);
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar el estado");
    }
  };

  if (estado !== "autenticado") return <div className="min-h-screen bg-[#05050A]" />;

  if (!puedeConsultar) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-[#131722]">
          <Lock size={26} className="text-gray-500" />
        </div>
        <h1 className="mb-3 text-2xl font-bold text-white">Panel del estudio</h1>
        <p className="text-sm leading-relaxed text-gray-400">
          Tu cuenta tiene el rol <span className="text-white">{rol}</span>. Este panel es para investigadores y
          administradores: el backend responde <span className="font-mono text-[#D4AF37]">403 NO_AUTORIZADO</span> a
          quien no lo sea, aunque llegue por la URL directa.
        </p>
      </div>
    );
  }

  const PESTANAS: Array<{ id: Pestana; nombre: string; icono: typeof Users; soloAdmin?: boolean }> = [
    { id: "usuarios", nombre: "Padrón", icono: Users },
    { id: "huellas", nombre: "Huellas", icono: Fingerprint },
    { id: "auditoria", nombre: "Auditoría", icono: ScrollText, soloAdmin: true },
    // Escribir catálogos es admin; el backend responde 403 al investigador.
    { id: "catalogos", nombre: "Catálogos", icono: Library, soloAdmin: true },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-20 pt-10 lg:px-8">
      <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
        <ScrollText size={14} /> Laboratorio · rol {rol}
      </p>
      <h1 className="mb-8 text-3xl font-black text-white sm:text-4xl">Panel del estudio</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {PESTANAS.filter((p) => !p.soloAdmin || esAdmin).map((p) => {
          const Icono = p.icono;
          return (
            <button
              key={p.id}
              onClick={() => setPestana(p.id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                pestana === p.id
                  ? "border-[#8A2BE2]/50 bg-[#1E1133] text-[#A78BFA]"
                  : "border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              <Icono size={14} /> {p.nombre}
            </button>
          );
        })}

        <button
          onClick={() => void cargar()}
          disabled={cargando}
          className="ml-auto flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 transition-colors hover:text-white disabled:opacity-40"
        >
          <RefreshCw size={14} className={cargando ? "animate-spin" : ""} /> Actualizar
        </button>
      </div>

      {error && (
        <p className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0B0E14] shadow-2xl">
        <div className="overflow-x-auto">
          {pestana === "catalogos" && (
            <div className="p-6">
              <CatalogosAdmin />
            </div>
          )}

          {pestana === "usuarios" && (
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 bg-[#131722]/50 text-[11px] uppercase tracking-widest text-[#D4AF37]">
                  <th className="px-6 py-4">Alias</th>
                  <th className="px-6 py-4">Código público</th>
                  <th className="px-6 py-4">Rango</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Último acceso</th>
                  {esAdmin && <th className="px-6 py-4">Cuenta</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {usuarios.map((usuario) => (
                  <tr key={usuario.participante_id} className="hover:bg-white/[0.03]">
                    <td className="px-6 py-3 font-medium text-gray-200">{usuario.alias}</td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">
                      {usuario.codigo_publico.slice(0, 8)}…
                    </td>
                    <td className="px-6 py-3 text-gray-400">{usuario.rango_edad}</td>
                    <td className="px-6 py-3">
                      <span className={usuario.estado === "activo" ? "text-green-500" : "text-gray-500"}>
                        {usuario.estado}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {esAdmin && usuario.cuenta ? (
                        <select
                          value={usuario.cuenta.rol}
                          onChange={(e) => void cambiarRol(usuario.participante_id, e.target.value as Rol)}
                          className="rounded-lg border border-white/10 bg-[#131722] px-2 py-1 text-xs text-gray-300 [&>option]:bg-[#131722]"
                        >
                          <option value="participante">participante</option>
                          <option value="investigador">investigador</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        <span className="text-gray-400">{usuario.cuenta?.rol ?? "—"}</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {usuario.cuenta?.ultimo_acceso_at
                        ? new Date(usuario.cuenta.ultimo_acceso_at).toLocaleString("es-MX")
                        : "—"}
                    </td>
                    {esAdmin && (
                      <td className="px-6 py-3">
                        <button
                          onClick={() =>
                            void cambiarEstadoDeCuenta(usuario.participante_id, !(usuario.cuenta?.activa ?? false))
                          }
                          className={`rounded-lg border px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                            usuario.cuenta?.activa
                              ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                              : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                          }`}
                        >
                          {usuario.cuenta?.activa ? "Desactivar" : "Activar"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {pestana === "huellas" && (
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 bg-[#131722]/50 text-[11px] uppercase tracking-widest text-[#D4AF37]">
                  <th className="px-6 py-4">Huella</th>
                  <th className="px-6 py-4">Resolución</th>
                  <th className="px-6 py-4">Zona horaria</th>
                  <th className="px-6 py-4">Visitas</th>
                  <th className="px-6 py-4">Recurrente</th>
                  <th className="px-6 py-4">Vista por última vez</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {huellas.map((huella) => (
                  <tr key={huella.id} className="hover:bg-white/[0.03]">
                    {/* Solo el prefijo: el hash completo identificaría el
                        dispositivo de forma estable si esto se filtrara. */}
                    <td className="px-6 py-3 font-mono text-xs text-gray-300">{huella.hash_huella_prefijo}</td>
                    <td className="px-6 py-3 text-gray-400">{huella.resolucion}</td>
                    <td className="px-6 py-3 text-gray-400">{huella.zona_horaria}</td>
                    <td className="px-6 py-3 font-mono text-gray-200">{huella.visitas}</td>
                    <td className="px-6 py-3">
                      <span className={huella.es_recurrente ? "text-[#D4AF37]" : "text-gray-500"}>
                        {huella.es_recurrente ? "sí" : "no"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {new Date(huella.actualizado_at).toLocaleString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {pestana === "auditoria" && (
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 bg-[#131722]/50 text-[11px] uppercase tracking-widest text-[#D4AF37]">
                  <th className="px-6 py-4">Cuándo</th>
                  <th className="px-6 py-4">Acción</th>
                  <th className="px-6 py-4">Entidad</th>
                  <th className="px-6 py-4">Sesión</th>
                  <th className="px-6 py-4">Después</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {auditoria.map((entrada) => (
                  <tr key={entrada.id} className="hover:bg-white/[0.03]">
                    <td className="whitespace-nowrap px-6 py-3 text-xs text-gray-500">
                      {new Date(entrada.ocurrido_at).toLocaleString("es-MX")}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-200">{entrada.accion}</td>
                    <td className="px-6 py-3 text-gray-400">{entrada.entidad}</td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">
                      {entrada.sesion_id ? entrada.sesion_id.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="max-w-[380px] truncate px-6 py-3 font-mono text-[11px] text-gray-500">
                      {entrada.datos_despues ? JSON.stringify(entrada.datos_despues) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {cargando && (
          <div className="flex items-center justify-center gap-3 py-12 text-gray-500">
            <RefreshCw size={20} className="animate-spin" />
            <span className="text-sm">Consultando…</span>
          </div>
        )}

        {!cargando && paginacion && (
          <div className="border-t border-white/5 px-6 py-4 text-xs text-gray-500">
            {paginacion.total} en total · mostrando hasta {paginacion.limite}
            {pestana === "auditoria" && " · la bitácora es de solo lectura: no hay POST, PATCH ni DELETE"}
          </div>
        )}
      </div>
    </div>
  );
}
