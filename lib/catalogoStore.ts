// lib/catalogoStore.ts
import { create } from "zustand";
import { ApiError, api } from "./api";
import type { Juego } from "./api";

/**
 * Catalogo de juegos, cacheado una vez por carga.
 *
 * Importa por algo mas que pintar la lista: casi toda la captura se atribuye a
 * un juego (`juego_id` en permisos, cookies, almacenamiento, eventos) y
 * `POST /resultados` lo exige. El frontend conoce sus salas por `slug` —es la
 * referencia publica y por eso el backend no deja cambiarlo—, asi que aqui se
 * resuelve slug -> id una sola vez y el resto de la app pregunta por slug.
 *
 * Si una sala no esta en el catalogo, `idDe()` devuelve null y la captura se
 * registra sin juego en vez de romperse: el recorrido pesa mas que la etiqueta.
 */

interface CatalogoState {
  juegos: Juego[];
  porSlug: Record<string, Juego>;
  cargando: boolean;
  cargado: boolean;
  error: string | null;
  /** El catalogo no se pudo leer por falta de identidad, no por un fallo. */
  requiereSesion: boolean;
  cargar: () => Promise<void>;
  reintentar: () => Promise<void>;
  idDe: (slug: string) => string | null;
}

let cargaEnVuelo: Promise<void> | null = null;

export const useCatalogoStore = create<CatalogoState>((set, get) => ({
  juegos: [],
  porSlug: {},
  cargando: false,
  cargado: false,
  error: null,
  requiereSesion: false,

  cargar: async () => {
    if (get().cargado || cargaEnVuelo) return cargaEnVuelo ?? undefined;

    cargaEnVuelo = (async () => {
      set({ cargando: true, error: null });
      try {
        const { juegos } = await api.juegos.listar({ limite: 100, solo_activos: true });
        set({
          juegos,
          porSlug: Object.fromEntries(juegos.map((juego) => [juego.slug, juego])),
          cargando: false,
          cargado: true,
          error: null,
          requiereSesion: false,
        });
      } catch (error) {
        // `GET /juegos` exige identidad: antes de entrar el 401 es lo normal, no
        // un fallo. Se distingue de los demas errores porque la UI tiene que
        // decir cosas opuestas —"inicia sesion" contra "el backend no
        // responde"— y confundirlas manda a buscar el problema donde no esta.
        const esFaltaDeSesion = error instanceof ApiError && error.esNoAutenticado;

        set({
          cargando: false,
          error: esFaltaDeSesion
            ? null
            : error instanceof Error
              ? error.message
              : "No se pudo cargar el catalogo",
          requiereSesion: esFaltaDeSesion,
        });
      } finally {
        cargaEnVuelo = null;
      }
    })();

    return cargaEnVuelo;
  },

  /**
   * Reintento explicito tras un fallo.
   *
   * `cargar()` se corta si ya hay una carga hecha o en vuelo, asi que sin esto
   * un fallo de red dejaba el catalogo vacio hasta recargar la pagina entera.
   */
  reintentar: async () => {
    set({ cargado: false, error: null, requiereSesion: false });
    return get().cargar();
  },

  idDe: (slug) => get().porSlug[slug]?.id ?? null,
}));
