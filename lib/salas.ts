// lib/salas.ts
import type { PermissionKey } from "./store";

/**
 * La parte de cada sala que es del frontend y no del backend.
 *
 * El catalogo (`GET /juegos`) manda el nombre, la descripcion, la tecnologia
 * demostrada y las instrucciones de seguridad. Lo que no puede mandar es la
 * imagen, el color ni que permiso del navegador abre la sala, porque eso es
 * presentacion. Se empareja por `slug`, que es la referencia publica y por eso
 * el backend no deja cambiarlo.
 */

export interface Sala {
  imagenFondo: string;
  colorAcento: string;
  colorTexto: string;
  /** Permiso que la sala pide al entrar; `null` es acceso libre. */
  permiso: PermissionKey | null;
  requisito: string;
}

export const SALAS: Record<string, Sala> = {
  tragamonedas: {
    imagenFondo: "/tragamonedas.png",
    colorAcento: "bg-yellow-500",
    colorTexto: "text-yellow-500",
    permiso: null,
    requisito: "Acceso libre",
  },
  ruleta: {
    imagenFondo: "/ruleta.png",
    colorAcento: "bg-orange-500",
    colorTexto: "text-orange-500",
    permiso: "notifications",
    requisito: "Requiere Notificaciones",
  },
  "rasca-y-gana": {
    imagenFondo: "/rasca.png",
    colorAcento: "bg-emerald-500",
    colorTexto: "text-emerald-500",
    permiso: null,
    requisito: "Acceso libre",
  },
  "blackjack-vip": {
    imagenFondo: "/blackjack-vip.png",
    colorAcento: "bg-red-500",
    colorTexto: "text-red-500",
    permiso: "location",
    requisito: "Requiere Ubicación",
  },
  "mesa-en-vivo": {
    imagenFondo: "/mesa-en-vivo.png",
    colorAcento: "bg-blue-500",
    colorTexto: "text-blue-500",
    permiso: "microphone",
    requisito: "Requiere Micrófono",
  },
};

const SALA_POR_DEFECTO: Sala = {
  imagenFondo: "/fondo.png",
  colorAcento: "bg-[#D4AF37]",
  colorTexto: "text-[#D4AF37]",
  permiso: null,
  requisito: "Sin requisitos",
};

export function salaDe(slug: string): Sala {
  return SALAS[slug] ?? SALA_POR_DEFECTO;
}
