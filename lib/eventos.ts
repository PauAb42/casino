// lib/eventos.ts
import { api } from "./api";
import type { EventoAEnviar } from "./api";
import { useLabStore } from "./labStore";

/**
 * Telemetria del navegador, en lotes.
 *
 * `POST /eventos` siempre recibe un lote, aunque sea de uno: el cliente acumula
 * y envia en rafagas. El tope del backend es 200 por peticion, asi que la cola
 * se vacia sola al llegar a 50 o cada cinco segundos, lo que ocurra antes.
 *
 * La cola vive fuera de React a proposito: cualquier modulo puede anotar un
 * evento sin arrastrar un hook, y un componente que se desmonta no se lleva los
 * eventos pendientes.
 */

const TAMANO_DE_LOTE = 50;
const INTERVALO_MS = 5_000;

let cola: EventoAEnviar[] = [];
let temporizador: ReturnType<typeof setTimeout> | null = null;
let enviando = false;

async function vaciar(): Promise<void> {
  if (enviando || cola.length === 0) return;

  const sesionId = useLabStore.getState().sesionId;
  if (!sesionId) return; // Sin sesion no hay de donde colgarlos: esperan.

  const lote = cola.slice(0, 200);
  cola = cola.slice(lote.length);
  enviando = true;

  try {
    await api.eventos.registrarLote({ sesion_id: sesionId, eventos: lote });
  } catch {
    // La telemetria nunca debe romper el recorrido: si falla, se descarta el
    // lote en vez de acumularlo indefinidamente en memoria.
  } finally {
    enviando = false;
  }
}

function programarVaciado() {
  if (temporizador) return;
  temporizador = setTimeout(() => {
    temporizador = null;
    void vaciar();
  }, INTERVALO_MS);
}

/** Anota un evento. `detalle` viaja tal cual a la columna JSONB. */
export function registrarEvento(
  tipoEvento: string,
  detalle: Record<string, unknown> = {},
  juegoId?: string | null,
): void {
  cola.push({
    tipo_evento: tipoEvento.slice(0, 60),
    detalle,
    juego_id: juegoId ?? null,
    // La hora la pone el cliente porque el lote se envia despues: si la pusiera
    // el servidor, todos los eventos de una rafaga compartirian marca.
    ocurrido_at: new Date().toISOString(),
  });

  if (cola.length >= TAMANO_DE_LOTE) void vaciar();
  else programarVaciado();
}

/** Fuerza el envio: al cerrar la sesion o antes de mostrar el informe. */
export async function vaciarEventos(): Promise<void> {
  if (temporizador) {
    clearTimeout(temporizador);
    temporizador = null;
  }
  await vaciar();
}
