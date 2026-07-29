// lib/api.ts
import { useAuthStore } from "./authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // Obtenemos el token directamente de Zustand
  const token = useAuthStore.getState().token;

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.mensaje || "Error en la petición");
  }

  return data;
}