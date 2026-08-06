// lib/labStore.ts
import { create } from "zustand";
import { ApiError, api } from "./api";
import type { Consentimiento, HuellaDeSesion, Sesion } from "./api";
import { inventarioDelNavegador, senalesDeHuella } from "./fingerprint";

/**
 * La sesion de laboratorio.
 *
 * No es una sesion de autenticacion —de esa se encarga el JWT— sino la unidad de
 * observacion: cookies, permisos, medios, eventos, resultados y respuestas
 * cuelgan todos de `sesion_id`. Sin sesion abierta no hay nada que capturar, asi
 * que casi toda la UI pasa por `asegurarSesion()`.
 *
 * El id se guarda en `localStorage` para sobrevivir a un refresco, pero nunca se
 * confia a ciegas: al arrancar se comprueba contra `GET /sesiones/:id` y, si ya
 * no esta activa, se abre una nueva.
 */

const CLAVE_SESION = "casino_lab_sesion_id";
export const VERSION_AVISO = "1.0";

/** Categorias que el aviso puede autorizar; son las de `datos_pasivos`. */
export const CATEGORIAS_DEL_AVISO = [
  "navegador",
  "dispositivo",
  "red",
  "comportamiento",
  "ubicacion",
] as const;

export type CategoriaDelAviso = (typeof CATEGORIAS_DEL_AVISO)[number];
export type AlcanceDelAviso = Partial<Record<CategoriaDelAviso, boolean>>;

interface LabState {
  sesionId: string | null;
  sesion: Sesion | null;
  huella: HuellaDeSesion | null;
  /** Te reconocio el dispositivo aunque no hubiera una sola cookie. */
  reconocidoSinCookies: boolean;
  consentimiento: Consentimiento | null;
  /** Distingue "todavia no pregunte" de "pregunte y no hay consentimiento". */
  consentimientoConsultado: boolean;
  abriendo: boolean;
  error: string | null;

  asegurarSesion: () => Promise<string | null>;
  refrescarConsentimiento: () => Promise<Consentimiento | null>;
  responderAviso: (
    aceptado: boolean,
    alcance: AlcanceDelAviso,
    msDecision: number | null,
  ) => Promise<Consentimiento | null>;
  reconsiderarAviso: (aceptado: boolean, alcance?: AlcanceDelAviso) => Promise<void>;
  revocarConsentimiento: () => Promise<void>;
  sincronizarAlmacenamiento: (juegoId?: string | null) => Promise<void>;
  cerrar: (motivo: "finalizada" | "abandonada") => Promise<void>;
  limpiar: () => void;
}

function leerSesionGuardada(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CLAVE_SESION);
}

function guardarSesion(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(CLAVE_SESION, id);
  else window.localStorage.removeItem(CLAVE_SESION);
}

/** Una sola apertura en vuelo: dos componentes montando a la vez no abren dos sesiones. */
let aperturaEnVuelo: Promise<string | null> | null = null;

export const useLabStore = create<LabState>((set, get) => ({
  sesionId: null,
  sesion: null,
  huella: null,
  reconocidoSinCookies: false,
  consentimiento: null,
  consentimientoConsultado: false,
  abriendo: false,
  error: null,

  asegurarSesion: async () => {
    const actual = get().sesionId;
    if (actual) return actual;
    if (aperturaEnVuelo) return aperturaEnVuelo;

    aperturaEnVuelo = (async () => {
      set({ abriendo: true, error: null });
      try {
        // 1. Reutilizar la sesion persistida si el backend la sigue dando por activa.
        const guardada = leerSesionGuardada();
        if (guardada) {
          try {
            const { sesion } = await api.sesiones.obtener(guardada);
            if (sesion.estado === "activa") {
              set({ sesionId: sesion.id, sesion, abriendo: false });
              await get().refrescarConsentimiento();
              return sesion.id;
            }
          } catch {
            // Cerrada, borrada o de otra cuenta: se abre una nueva mas abajo.
          }
          guardarSesion(null);
        }

        // 2. Abrir una nueva. Aqui es donde el backend registra la huella y
        //    responde si este dispositivo ya habia estado antes.
        const huella = await senalesDeHuella();
        const respuesta = await api.sesiones.abrir(huella);
        guardarSesion(respuesta.sesion.id);
        set({
          sesionId: respuesta.sesion.id,
          sesion: respuesta.sesion,
          huella: respuesta.huella,
          reconocidoSinCookies: respuesta.reconocido_sin_cookies,
          consentimiento: null,
          consentimientoConsultado: true,
          abriendo: false,
        });
        return respuesta.sesion.id;
      } catch (error) {
        set({
          abriendo: false,
          error: error instanceof ApiError ? error.message : "No se pudo abrir la sesion de laboratorio",
        });
        return null;
      } finally {
        aperturaEnVuelo = null;
      }
    })();

    return aperturaEnVuelo;
  },

  refrescarConsentimiento: async () => {
    const sesionId = get().sesionId;
    if (!sesionId) return null;

    try {
      const { consentimiento } = await api.consentimientos.obtener(sesionId);
      set({ consentimiento, consentimientoConsultado: true });
      return consentimiento;
    } catch (error) {
      // 404 es la respuesta normal antes de mostrar el aviso, no un fallo.
      if (error instanceof ApiError && error.esNoEncontrado) {
        set({ consentimiento: null, consentimientoConsultado: true });
        return null;
      }
      throw error;
    }
  },

  responderAviso: async (aceptado, alcance, msDecision) => {
    const sesionId = await get().asegurarSesion();
    if (!sesionId) return null;

    // Un "acepto" con alcance vacio no autoriza nada: el backend responde 422.
    const alcanceEfectivo = aceptado
      ? Object.fromEntries(Object.entries(alcance).filter(([, valor]) => valor))
      : {};

    const { consentimiento } = await api.consentimientos.registrar({
      sesion_id: sesionId,
      version_aviso: VERSION_AVISO,
      aceptado,
      alcance: alcanceEfectivo,
      // Null solo si de verdad no se midio; 0 significa "respondio al instante".
      ms_decision: msDecision,
    });

    set({ consentimiento, consentimientoConsultado: true });
    return consentimiento;
  },

  reconsiderarAviso: async (aceptado, alcance) => {
    const sesionId = get().sesionId;
    if (!sesionId) return;

    const { consentimiento } = await api.consentimientos.reconsiderar({
      sesion_id: sesionId,
      aceptado,
      // Reconsiderar conserva el `ms_decision` de la primera decision.
      alcance: alcance ? Object.fromEntries(Object.entries(alcance).filter(([, v]) => v)) : undefined,
    });
    set({ consentimiento });
  },

  revocarConsentimiento: async () => {
    const sesionId = get().sesionId;
    if (!sesionId) return;

    const { consentimiento } = await api.consentimientos.revocar(sesionId);
    set({ consentimiento });
  },

  /**
   * Declara al backend lo que hay en `localStorage` y `sessionStorage`.
   *
   * Es el unico grupo de captura que el servidor no puede observar por si mismo,
   * asi que si esta llamada no ocurre, el informe final dira que no hay nada.
   */
  sincronizarAlmacenamiento: async (juegoId) => {
    const sesionId = get().sesionId;
    if (!sesionId) return;

    const inventario = inventarioDelNavegador();
    await api.almacenamiento
      .sincronizar({
        sesion_id: sesionId,
        juego_id: juegoId ?? null,
        entradas: inventario.entradas,
        areas_sincronizadas: inventario.areas_sincronizadas,
      })
      .catch(() => undefined);
  },

  cerrar: async (motivo) => {
    const sesionId = get().sesionId;
    if (!sesionId) return;

    try {
      const { sesion } = await api.sesiones.cerrar(sesionId, motivo);
      set({ sesion });
    } catch {
      // Cerrar una sesion ya cerrada responde 422: no es un error del recorrido.
    }
    guardarSesion(null);
    set({ sesionId: null });
  },

  limpiar: () => {
    guardarSesion(null);
    set({
      sesionId: null,
      sesion: null,
      huella: null,
      reconocidoSinCookies: false,
      consentimiento: null,
      consentimientoConsultado: false,
      error: null,
    });
  },
}));

/** Atajo para codigo fuera de React (helpers de permisos, cola de eventos). */
export function sesionActual(): string | null {
  return useLabStore.getState().sesionId;
}
