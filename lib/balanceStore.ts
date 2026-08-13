import { create } from "zustand";
import { ApiError, api } from "./api";
import type { EstadoDeRetiro, ResumenDeJuego } from "./api";

/**
 * El saldo, tal como lo dice el servidor.
 *
 * Antes esto era un `useState` global que arrancaba en 12,450.75 y que cada sala
 * subia y bajaba a mano. Eso tenia dos problemas y ninguno era de estilo: el
 * numero lo podia reescribir cualquiera desde la consola del navegador, y un
 * refresco lo devolvia al valor inicial como si las apuestas nunca hubieran
 * ocurrido.
 *
 * Ahora el store es un **espejo de solo lectura** de `GET /billetera`. No existe
 * ningun `setBalance(n)`: el saldo solo cambia como consecuencia de una
 * operacion del backend (apostar, cobrar, depositar, retirar), y esas
 * operaciones devuelven la billetera ya actualizada. Por eso lo unico que se
 * expone para escribir es `aplicarBilletera()`, que recibe la respuesta del
 * servidor, y `refrescar()`, que la vuelve a pedir.
 *
 * Los importes se guardan en **centavos enteros**, igual que en la base. `saldo`
 * en pesos es un derivado para pintar; nunca la cifra con la que se opera.
 */

interface BalanceState {
  /** Centavos. La cifra autoritativa. */
  saldoCentavos: number;
  /** Pesos, solo para mostrar. */
  saldo: number;
  moneda: string;
  bloqueada: boolean;
  /** Resumen de juego acumulado de la cuenta (rondas, apostado, neto). */
  juego: ResumenDeJuego | null;
  /** Si hay rollover pendiente que impide retirar, y por que. */
  retiro: EstadoDeRetiro | null;
  /** `false` hasta que `GET /billetera` responde por primera vez. */
  cargado: boolean;
  cargando: boolean;
  error: string | null;

  refrescar: () => Promise<void>;
  aplicarBilletera: (billetera: { saldo_centavos: number; saldo_mxn: number; bloqueada?: boolean }) => void;
  limpiar: () => void;
}

/** Una sola peticion en vuelo: cinco salas montando a la vez no piden cinco veces. */
let refrescoEnVuelo: Promise<void> | null = null;

export const useBalanceStore = create<BalanceState>((set) => ({
  saldoCentavos: 0,
  saldo: 0,
  moneda: "MXN",
  bloqueada: false,
  juego: null,
  retiro: null,
  cargado: false,
  cargando: false,
  error: null,

  refrescar: async () => {
    if (refrescoEnVuelo) return refrescoEnVuelo;

    refrescoEnVuelo = (async () => {
      set({ cargando: true, error: null });
      try {
        const estado = await api.billetera.estado();
        set({
          saldoCentavos: estado.billetera.saldo_centavos,
          saldo: estado.billetera.saldo_mxn,
          moneda: estado.billetera.moneda,
          bloqueada: estado.billetera.bloqueada,
          juego: estado.juego,
          retiro: estado.retiro,
          cargado: true,
          cargando: false,
        });
      } catch (error) {
        // Antes de entrar es normal que falle: la billetera exige token.
        set({
          cargando: false,
          error: error instanceof ApiError ? error.message : "No se pudo consultar tu saldo",
        });
      } finally {
        refrescoEnVuelo = null;
      }
    })();

    return refrescoEnVuelo;
  },

  /**
   * Aplica la billetera que devolvio una operacion.
   *
   * Apostar, cobrar, depositar y retirar responden con el saldo ya actualizado,
   * asi que no hace falta un `GET` extra despues de cada accion. Y como el valor
   * viene del servidor, no hay forma de que la UI y la base se separen.
   */
  aplicarBilletera: (billetera) =>
    set({
      saldoCentavos: billetera.saldo_centavos,
      saldo: billetera.saldo_mxn,
      bloqueada: billetera.bloqueada ?? false,
      cargado: true,
      error: null,
    }),

  limpiar: () =>
    set({
      saldoCentavos: 0,
      saldo: 0,
      juego: null,
      retiro: null,
      cargado: false,
      error: null,
    }),
}));

/** Centavos -> pesos. La conversion vive en un solo sitio del cliente. */
export function aPesos(centavos: number): number {
  return Math.round(centavos) / 100;
}

/**
 * Pesos -> centavos, para lo que escribe la persona en un formulario.
 *
 * El redondeo no es cosmetico: `15.15 * 100` da `1514.9999999999998` en coma
 * flotante, y sin el `Math.round` un deposito de $15.15 mandaria 1514 centavos.
 */
export function aCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}
