import { create } from "zustand";

export type PermissionKey =
  | "camera"
  | "microphone"
  | "location"
  | "notifications"
  | "cookies"
  | "localStorage";

export type PermissionStatus = "idle" | "granted" | "denied";

export interface LogEntry {
  id: string;
  timestamp: string;
  permission: PermissionKey;
  status: PermissionStatus;
  detail: string;
}

interface ZeroTrustState {
  permissions: Record<PermissionKey, PermissionStatus>;
  log: LogEntry[];
  dataPot: number;
  setPermission: (key: PermissionKey, status: PermissionStatus, detail: string) => void;
  reset: () => void;
}

const POT_VALUE_PER_GRANT = 15; // "cuánto vales" en fichas simbólicas por cada dato entregado

const initialPermissions: Record<PermissionKey, PermissionStatus> = {
  camera: "idle",
  microphone: "idle",
  location: "idle",
  notifications: "idle",
  cookies: "idle",
  localStorage: "idle",
};

export const useZeroTrustStore = create<ZeroTrustState>((set) => ({
  permissions: initialPermissions,
  log: [],
  dataPot: 0,

  setPermission: (key, status, detail) =>
    set((state) => {
      const wasGranted = state.permissions[key] === "granted";
      const isNowGranted = status === "granted";

      const entry: LogEntry = {
        id: `${key}-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("es-MX"),
        permission: key,
        status,
        detail,
      };

      return {
        permissions: { ...state.permissions, [key]: status },
        log: [entry, ...state.log].slice(0, 30),
        dataPot:
          !wasGranted && isNowGranted
            ? state.dataPot + POT_VALUE_PER_GRANT
            : state.dataPot,
      };
    }),

  reset: () => set({ permissions: initialPermissions, log: [], dataPot: 0 }),
}));
