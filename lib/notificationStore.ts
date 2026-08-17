import { create } from "zustand";

/**
 * Notificaciones del casino: una sola puerta para dos superficies.
 *
 * Hasta ahora la bandeja de la campana era lo único con diseño, y lo que de
 * verdad interrumpía al jugador —"saldo insuficiente", "ganaste $500"— salía por
 * `alert()` o por `new Notification()` del sistema operativo. Las dos son del
 * navegador: rompen la estética, no se pueden alinear con la sala y, en el caso
 * de la notificación nativa, **solo aparecen si el permiso está concedido**, así
 * que la mitad de los jugadores no veía nada.
 *
 * `notificar()` escribe en las dos superficies a la vez:
 *   - el **aviso flotante** (`toasts`), que <Toaster /> pinta con la piel del
 *     casino y se va solo;
 *   - la **bandeja** (`notifications`), que es el historial de la campana.
 *
 * Lo nativo del navegador se reserva para la Ruleta, que es la sala cuyo tema
 * es justamente la Notification API: ahí ver el globo del sistema operativo es
 * la demostración, no un descuido de diseño.
 */

export type TipoDeNotificacion = "exito" | "error" | "aviso" | "info";

export type CasinoNotification = {
  id: string;
  titulo: string | null;
  message: string;
  tipo: TipoDeNotificacion;
  read: boolean;
  date: Date;
};

export type AvisoFlotante = {
  id: string;
  titulo: string | null;
  mensaje: string;
  tipo: TipoDeNotificacion;
  duracionMs: number;
};

export interface EntradaDeNotificacion {
  mensaje: string;
  titulo?: string;
  tipo?: TipoDeNotificacion;
  /** Cuánto vive el aviso flotante. `0` lo deja fijo hasta que se cierre. */
  duracionMs?: number;
  /** `false` para un aviso efímero que no ensucia el historial de la campana. */
  enBandeja?: boolean;
}

/** Lo que dura cada tipo en pantalla: un error necesita más tiempo que un premio. */
const DURACION_POR_TIPO: Record<TipoDeNotificacion, number> = {
  exito: 5000,
  info: 5000,
  aviso: 6500,
  error: 7500,
};

/** Cuántos avisos caben a la vez antes de empujar al más viejo. */
const MAXIMO_EN_PANTALLA = 4;

/**
 * `Date.now()` se repetía cuando dos avisos salían en el mismo milisegundo —dos
 * líneas premiadas resueltas juntas, por ejemplo— y React se quedaba con una
 * sola por la colisión de `key`. El contador lo vuelve imposible.
 */
let secuencia = 0;
const siguienteId = () => `n${Date.now().toString(36)}-${(secuencia += 1).toString(36)}`;

interface NotificationState {
  notifications: CasinoNotification[];
  toasts: AvisoFlotante[];
  /** La puerta completa: aviso flotante con diseño + entrada en la bandeja. */
  notificar: (entrada: EntradaDeNotificacion) => string;
  /** Atajo histórico; sigue funcionando en las decenas de sitios que lo usan. */
  addNotification: (message: string, tipo?: TipoDeNotificacion) => string;
  descartarToast: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Iniciamos con una notificación de bienvenida por defecto
  notifications: [
    {
      id: "bienvenida",
      titulo: "Bienvenido",
      message: "¡Bienvenido a la experiencia VIP de Royal Casino!",
      tipo: "info",
      read: false,
      date: new Date(),
    },
  ],
  toasts: [],

  notificar: ({ mensaje, titulo, tipo = "info", duracionMs, enBandeja = true }) => {
    const id = siguienteId();

    set((state) => ({
      toasts: [
        ...state.toasts.slice(-(MAXIMO_EN_PANTALLA - 1)),
        {
          id,
          titulo: titulo ?? null,
          mensaje,
          tipo,
          duracionMs: duracionMs ?? DURACION_POR_TIPO[tipo],
        },
      ],
      notifications: enBandeja
        ? [
            { id, titulo: titulo ?? null, message: mensaje, tipo, read: false, date: new Date() },
            ...state.notifications,
          ]
        : state.notifications,
    }));

    return id;
  },

  addNotification: (message, tipo = "info") => get().notificar({ mensaje: message, tipo }),

  descartarToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  clearAll: () => set({ notifications: [] }),
}));

/**
 * Para llamar desde fuera de un componente (manejadores async, catch, timeouts)
 * sin arrastrar el hook hasta ahí.
 */
export const notificar = (entrada: EntradaDeNotificacion) =>
  useNotificationStore.getState().notificar(entrada);
