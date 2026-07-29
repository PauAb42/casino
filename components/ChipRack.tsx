"use client";

import { useZeroTrustStore } from "@/lib/store";

const PERMISSION_LABELS: Record<string, string> = {
  camera: "Cámara",
  microphone: "Micrófono",
  location: "Ubicación",
  notifications: "Notificaciones",
  cookies: "Cookies",
  localStorage: "Local Storage",
};

export default function ChipRack() {
  const { permissions, dataPot } = useZeroTrustStore();
  const granted = Object.entries(permissions).filter(([, s]) => s === "granted");

  return (
    <div className="flex items-center gap-4 rounded-full border border-gold/30 bg-felt/60 felt-texture px-5 py-2.5 backdrop-blur">
      <div className="flex flex-col leading-none">
        <span className="font-mono text-[10px] uppercase tracking-widest text-paper/50">
          Pozo de datos
        </span>
        <span className="font-marquee text-2xl text-gold">
          {dataPot.toString().padStart(3, "0")}
          <span className="ml-1 text-sm text-paper/60">fichas</span>
        </span>
      </div>

      <div className="h-8 w-px bg-paper/10" />

      <div className="flex -space-x-2">
        {granted.length === 0 && (
          <span className="font-mono text-xs text-paper/40">sin apuestas todavía</span>
        )}
        {granted.map(([key]) => (
          <div
            key={key}
            title={PERMISSION_LABELS[key]}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-void bg-alert text-[10px] font-mono font-semibold text-void shadow-chip"
          >
            {PERMISSION_LABELS[key].slice(0, 2).toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
}
