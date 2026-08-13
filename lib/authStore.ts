// lib/authStore.ts
import { create } from "zustand";
import { ApiError, api } from "./api";
import type { Cuenta, Identidad, Participante, RangoEdad } from "./api";
import { guardarToken, leerToken } from "./api/token";
import { useLabStore } from "./labStore";

/**
 * Identidad del participante.
 *
 * El token vive en memoria y la cookie httpOnly `casino_sesion` es la que
 * sobrevive al refresco: al montar la app, `rehidratar()` llama `GET /auth/yo`
 * y la cookie hace el trabajo. Guardar el JWT en `localStorage` seria la via
 * comoda y justamente la que este laboratorio ensena a desconfiar.
 */

export interface PoliticaDeContrasenaUi {
  largo_minimo: number;
  largo_maximo: number;
  descripcion: string;
}

interface AuthState {
  /** Forma que ya consumen las paginas: `user.participante.alias`. */
  user: Identidad | null;
  participante: Participante | null;
  cuenta: Cuenta | null;
  token: string | null;
  /** `desconocido` hasta que `GET /auth/yo` responde: evita expulsar al vuelo. */
  estado: "desconocido" | "autenticado" | "anonimo";
  isLoading: boolean;
  error: string | null;
  politica: PoliticaDeContrasenaUi | null;

  login: (correo: string, contrasena: string, recordarme?: boolean) => Promise<boolean>;
  registrar: (datos: {
    alias: string;
    correo: string;
    contrasena: string;
    rango_edad: RangoEdad;
  }) => Promise<boolean>;
  rehidratar: () => Promise<void>;
  cargarPolitica: () => Promise<void>;
  logout: () => Promise<void>;
  limpiarError: () => void;
}

function aplicarIdentidad(identidad: Identidad) {
  return {
    user: identidad,
    participante: identidad.participante,
    cuenta: identidad.cuenta,
    estado: "autenticado" as const,
    error: null,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  participante: null,
  cuenta: null,
  token: null,
  estado: "desconocido",
  isLoading: false,
  error: null,
  politica: null,

  /**
   * @param recordarme Emite un token de larga duracion y una cookie que
   * sobrevive al cierre del navegador. No es una preferencia de la interfaz:
   * cambia la credencial que emite el backend, y por eso viaja en la peticion.
   */
  login: async (correo, contrasena, recordarme = false) => {
    set({ isLoading: true, error: null });
    try {
      const datos = await api.auth.login({ correo, contrasena, recordarme });
      guardarToken(datos.token);
      set({
        ...aplicarIdentidad({ participante: datos.participante, cuenta: datos.cuenta }),
        token: datos.token,
        isLoading: false,
      });
      return true;
    } catch (error) {
      // El backend responde 401 identico para correo inexistente y contrasena
      // incorrecta (hash senuelo): la UI no debe intentar distinguirlos.
      set({
        error: error instanceof ApiError ? error.message : "No se pudo iniciar sesion",
        isLoading: false,
        estado: "anonimo",
      });
      return false;
    }
  },

  registrar: async (datos) => {
    set({ isLoading: true, error: null });
    try {
      await api.auth.registro(datos);
      // El registro no emite token: dar de alta y entrar son actos distintos.
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        error: error instanceof ApiError ? error.message : "No se pudo crear la cuenta",
        isLoading: false,
      });
      return false;
    }
  },

  /** Recupera la identidad con la cookie httpOnly tras un refresco de pagina. */
  rehidratar: async () => {
    try {
      const identidad = await api.auth.yo();
      set({ ...aplicarIdentidad(identidad), token: leerToken(), isLoading: false });
    } catch {
      guardarToken(null);
      set({ user: null, participante: null, cuenta: null, token: null, estado: "anonimo" });
    }
  },

  cargarPolitica: async () => {
    try {
      const { contrasena } = await api.auth.politica();
      set({ politica: contrasena });
    } catch {
      // La politica solo adorna el formulario: si falla, el backend valida igual.
    }
  },

  logout: async () => {
    // La sesion de laboratorio se cierra como `abandonada`: salir a medias del
    // recorrido no es lo mismo que terminarlo, y el analisis distingue las dos.
    await useLabStore.getState().cerrar("abandonada").catch(() => undefined);
    await api.auth.logout().catch(() => undefined);
    guardarToken(null);
    useLabStore.getState().limpiar();
    set({ user: null, participante: null, cuenta: null, token: null, estado: "anonimo", error: null });
  },

  limpiarError: () => set({ error: null }),
}));
