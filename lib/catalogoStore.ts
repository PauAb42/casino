// lib/catalogoStore.ts
import { create } from "zustand";
import { api } from "./api";
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
  cargar: () => Promise<void>;
  idDe: (slug: string) => string | null;
}

let cargaEnVuelo: Promise<void> | null = null;

export const useCatalogoStore = create<CatalogoState>((set, get) => ({
  juegos: [],
  porSlug: {},
  cargando: false,
  cargado: false,
  error: null,

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
        });
      } catch (error) {
        // Leer el catalogo exige token: antes de entrar es normal que falle.
        set({
          cargando: false,
          error: error instanceof Error ? error.message : "No se pudo cargar el catalogo",
        });
      } finally {
        cargaEnVuelo = null;
      }
    })();

    return cargaEnVuelo;
  },

  idDe: (slug) => get().porSlug[slug]?.id ?? null,
}));
