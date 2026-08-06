// lib/api/client.ts
import { leerToken } from "./token";

/**
 * Cliente HTTP del laboratorio.
 *
 * Reglas que vienen del backend y que este archivo respeta en un solo sitio:
 *
 * - Todo cuelga de `/api/v1`; `/health` es la unica ruta fuera del prefijo.
 * - `snake_case` en query, cuerpo y respuesta.
 * - Los errores siempre llegan como `{ error: { codigo, mensaje, detalles } }`,
 *   asi que se traducen a un `ApiError` con el codigo semantico intacto: la UI
 *   necesita distinguir un 422 de `REGLA_DE_NEGOCIO` de un 401.
 * - `credentials: "include"` para que viaje la cookie httpOnly `casino_sesion`.
 *   Requiere que el backend declare el origen exacto del front en `CORS_ORIGIN`
 *   (con `*` el navegador rechaza las credenciales).
 */

const RAIZ = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const API_RAIZ = RAIZ;
export const API_BASE = `${RAIZ}/api/v1`;

export interface DetalleDeError {
  campo: string;
  mensaje: string;
}

export type CodigoDeError =
  | "VALIDACION"
  | "JSON_INVALIDO"
  | "NO_AUTENTICADO"
  | "NO_AUTORIZADO"
  | "NO_ENCONTRADO"
  | "RUTA_NO_ENCONTRADA"
  | "CONFLICTO"
  | "REGLA_DE_NEGOCIO"
  | "DEMASIADAS_PETICIONES"
  | "ERROR_INTERNO"
  | "SIN_RED";

export class ApiError extends Error {
  readonly codigo: CodigoDeError;
  readonly estado: number;
  readonly detalles: DetalleDeError[];

  constructor(codigo: CodigoDeError, mensaje: string, estado: number, detalles: DetalleDeError[] = []) {
    super(mensaje);
    this.name = "ApiError";
    this.codigo = codigo;
    this.estado = estado;
    this.detalles = detalles;
  }

  /** No hay identidad o el token caduco: la UI debe volver a pedir login. */
  get esNoAutenticado() {
    return this.codigo === "NO_AUTENTICADO";
  }

  /** El recurso no existe. Se consulta tanto que merece su propio atajo. */
  get esNoEncontrado() {
    return this.codigo === "NO_ENCONTRADO";
  }

  /** Sintacticamente valido pero choca con una invariante del dominio. */
  get esReglaDeNegocio() {
    return this.codigo === "REGLA_DE_NEGOCIO";
  }
}

export type ValorDeConsulta = string | number | boolean | null | undefined;
export type Consulta = Record<string, ValorDeConsulta>;

/** Arma la query saltandose lo que no se envio: `?a=1&b=true`. */
function armarConsulta(consulta?: Consulta): string {
  if (!consulta) return "";

  const partes = new URLSearchParams();
  for (const [clave, valor] of Object.entries(consulta)) {
    if (valor === undefined || valor === null || valor === "") continue;
    partes.set(clave, String(valor));
  }

  const cadena = partes.toString();
  return cadena ? `?${cadena}` : "";
}

interface OpcionesDePeticion {
  metodo?: "GET" | "POST" | "PATCH" | "DELETE";
  cuerpo?: unknown;
  consulta?: Consulta;
  /** Rutas publicas (`/auth/login`, `/inferencia-pasiva`): no manda Authorization. */
  publica?: boolean;
  senal?: AbortSignal;
}

export async function pedir<T>(ruta: string, opciones: OpcionesDePeticion = {}): Promise<T> {
  const { metodo = "GET", cuerpo, consulta, publica = false, senal } = opciones;

  const cabeceras = new Headers();
  if (cuerpo !== undefined) cabeceras.set("Content-Type", "application/json");

  const token = publica ? null : leerToken();
  if (token) cabeceras.set("Authorization", `Bearer ${token}`);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_BASE}${ruta}${armarConsulta(consulta)}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      // La cookie httpOnly del backend es la otra via del token.
      credentials: "include",
      signal: senal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(
      "SIN_RED",
      "No se pudo contactar al servidor del laboratorio. Revisa que el backend este arriba.",
      0,
    );
  }

  // 204 (logout) no trae cuerpo, y un cuerpo vacio con otro estado tampoco
  // deberia romper: se responde `undefined` en vez de reventar el JSON.parse.
  const texto = await respuesta.text();
  const datos = texto ? (JSON.parse(texto) as unknown) : undefined;

  if (!respuesta.ok) {
    const error = (datos as { error?: { codigo?: string; mensaje?: string; detalles?: DetalleDeError[] } })?.error;
    throw new ApiError(
      (error?.codigo as CodigoDeError) ?? "ERROR_INTERNO",
      error?.mensaje ?? "Ocurrio un error inesperado",
      respuesta.status,
      error?.detalles ?? [],
    );
  }

  return datos as T;
}

/** `GET /health` vive fuera de `/api/v1`: la sonda no depende de la version. */
export async function salud(): Promise<{ estado: string; base_de_datos?: string }> {
  const respuesta = await fetch(`${API_RAIZ}/health`, { credentials: "include" });
  return (await respuesta.json()) as { estado: string; base_de_datos?: string };
}
