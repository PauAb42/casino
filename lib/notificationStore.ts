import { create } from "zustand";

export type CasinoNotification = {
  id: string;
  message: string;
  read: boolean;
  date: Date;
};

interface NotificationState {
  notifications: CasinoNotification[];
  addNotification: (message: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  // Iniciamos con una notificación de bienvenida por defecto
  notifications: [
    { id: "1", message: "¡Bienvenido a la experiencia VIP de Royal Casino!", read: false, date: new Date() }
  ],
  addNotification: (message) => set((state) => ({
    notifications: [
      { id: Date.now().toString(), message, read: false, date: new Date() },
      ...state.notifications
    ]
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),
  clearAll: () => set({ notifications: [] })
}));