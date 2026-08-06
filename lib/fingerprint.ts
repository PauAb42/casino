// lib/fingerprint.ts
import type { EntradaASincronizar, SenalesDeHuella, SenalesDelCliente } from "./api";

/**
 * Lo que el navegador entrega sin abrir un solo dialogo.
 *
 * Es el material del laboratorio: `POST /sesiones` lo convierte en `hash_huella`
 * (HMAC de las cuatro senales) y `POST /inferencia-pasiva` lo usa para el informe
 * de "esto supimos de ti sin pedirte permiso". Nada de aqui requiere permiso:
 * ese es exactamente el punto.
 */

/** SHA-256 en hex si hay contexto seguro; si no, djb2 —basta para agrupar. */
async function hashear(texto: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    try {
      const bytes = new TextEncoder().encode(texto);
      const resumen = await crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(resumen))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch {
      // Contexto no seguro (http en un host que no es localhost): sigue al fallback.
    }
  }

  let hash = 5381;
  for (let i = 0; i < texto.length; i += 1) {
    hash = ((hash << 5) + hash + texto.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Huella de canvas: el mismo texto dibujado da un PNG distinto en cada
 * combinacion de GPU, drivers y antialiasing. Es la senal que sigue
 * identificando el dispositivo despues de borrar las cookies.
 */
async function huellaDeCanvas(): Promise<string> {
  try {
    const lienzo = document.createElement("canvas");
    lienzo.width = 260;
    lienzo.height = 60;
    const ctx = lienzo.getContext("2d");
    if (!ctx) return "canvas-no-disponible";

    ctx.textBaseline = "top";
    ctx.font = "16px 'Arial'";
    ctx.fillStyle = "#0E3B2E";
    ctx.fillRect(0, 0, 260, 60);
    ctx.fillStyle = "#C9A227";
    ctx.fillText("Royal Casino ♠♥♦♣ 0123456789", 4, 8);
    ctx.strokeStyle = "rgba(69,208,181,0.7)";
    ctx.arc(120, 30, 22, 0, Math.PI * 2);
    ctx.stroke();

    return await hashear(lienzo.toDataURL());
  } catch {
    return "canvas-bloqueado";
  }
}

/** Modelo de la tarjeta grafica, revelado por WebGL sin pedir nada. */
function gpuWebgl(): string {
  try {
    const lienzo = document.createElement("canvas");
    const gl = (lienzo.getContext("webgl") ?? lienzo.getContext("experimental-webgl")) as
      | WebGLRenderingContext
      | null;
    if (!gl) return "webgl-no-disponible";

    const info = gl.getExtension("WEBGL_debug_renderer_info");
    if (info) {
      const renderizador = gl.getParameter(info.UNMASKED_RENDERER_WEBGL) as string | null;
      if (renderizador) return String(renderizador).slice(0, 256);
    }
    return String(gl.getParameter(gl.RENDERER) ?? "webgl-anonimo").slice(0, 256);
  } catch {
    return "webgl-bloqueado";
  }
}

function resolucion(): string {
  return `${window.screen.width}x${window.screen.height}`;
}

function zonaHoraria(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Las cuatro senales con las que `POST /sesiones` deriva la huella. */
export async function senalesDeHuella(): Promise<SenalesDeHuella> {
  return {
    canvas_hash: await huellaDeCanvas(),
    gpu_webgl: gpuWebgl(),
    resolucion: resolucion(),
    zona_horaria: zonaHoraria(),
  };
}

/**
 * Senales del cliente para `POST /inferencia-pasiva`.
 *
 * Todas opcionales: el endpoint responde igual con el cuerpo vacio porque la
 * mitad del informe sale de las cabeceras. Cada campo que se suma es una senal
 * mas que el visitante ve aparecer en su propio perfil.
 */
export function senalesDelCliente(): SenalesDelCliente {
  const navegador = navigator as Navigator & { deviceMemory?: number; userAgentData?: { platform?: string } };

  return {
    resolucion: resolucion(),
    zona_horaria: zonaHoraria(),
    // El signo va invertido a proposito: `getTimezoneOffset` devuelve minutos
    // "para llegar a UTC" y el backend espera el desfase real (UTC-6 = -360).
    desfase_utc_minutos: -new Date().getTimezoneOffset(),
    plataforma: navegador.userAgentData?.platform || navigator.platform || undefined,
    nucleos_cpu: navigator.hardwareConcurrency || undefined,
    memoria_gb: navegador.deviceMemory,
    profundidad_color: window.screen.colorDepth || undefined,
    pantalla_touch: navigator.maxTouchPoints > 0,
  };
}

/** Tope del backend: 100 claves por sincronizacion y muestra de 512 caracteres. */
const MAXIMO_DE_CLAVES = 100;
const MUESTRA_MAXIMA = 512;

function leerArea(area: "local" | "sesion", almacen: Storage): EntradaASincronizar[] {
  const entradas: EntradaASincronizar[] = [];

  for (let i = 0; i < almacen.length && entradas.length < MAXIMO_DE_CLAVES; i += 1) {
    const clave = almacen.key(i);
    if (clave === null) continue;

    const valor = almacen.getItem(clave) ?? "";
    entradas.push({
      area,
      clave: clave.slice(0, 512),
      valor: valor.slice(0, MUESTRA_MAXIMA),
      // El tamano real va aparte cuando la muestra viene recortada: es lo que
      // permite al informe decir "esto no cabria en una cookie".
      tamano_bytes: new Blob([valor]).size,
    });
  }

  return entradas;
}

/**
 * Inventario de Web Storage tal como esta ahora.
 *
 * Es el unico grupo de captura que el servidor no puede medir: `localStorage` no
 * viaja en las peticiones. Lo que no se declare aqui, el backend no lo sabe.
 */
export function inventarioDelNavegador(): {
  entradas: EntradaASincronizar[];
  areas_sincronizadas: Array<"local" | "sesion">;
} {
  const entradas: EntradaASincronizar[] = [];
  try {
    entradas.push(...leerArea("local", window.localStorage));
  } catch {
    // Modo privado o storage bloqueado: se declara el area vacia igual.
  }
  try {
    entradas.push(...leerArea("sesion", window.sessionStorage));
  } catch {
    // Idem.
  }

  return {
    entradas: entradas.slice(0, MAXIMO_DE_CLAVES),
    areas_sincronizadas: ["local", "sesion"],
  };
}
