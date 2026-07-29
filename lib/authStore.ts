// lib/authStore.ts
import { create } from "zustand";
import { fetchApi } from "./api";

interface UserProfile {
  participante: {
    id: string;
    alias: string;
    estado: string;
  };
  cuenta: {
    id: string;
    rol: string;
  };
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (correo: string, contrasena: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (correo, contrasena) => {
    set({ isLoading: true, error: null });
    try {
      // Consumimos el endpoint real de tu backend
      const data = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ correo, contrasena }),
      });

      set({ 
        user: { participante: data.participante, cuenta: data.cuenta },
        token: data.token,
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  logout: () => set({ user: null, token: null }),
}));