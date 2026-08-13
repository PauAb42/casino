"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api } from "./api";
import type { AccionDeBlackjack, RondaDeJuego, SalaConApuesta } from "./api";
import { useBalanceStore } from "./balanceStore";
import { useCatalogoStore } from "./catalogoStore";
import { useLabStore } from "./labStore";
import { usePartida } from "./usePartida";

/**
 * Una sala con dinero.
 *
 * Reemplaza el patron que tenian las cinco salas: cada una generaba su resultado
 * con `Math.random()`, calculaba su propio premio y movia un saldo en memoria.
 * Eso significa que el desenlace y el importe a cobrar los decidia el mismo
 * navegador que apostaba.
 *
 * Aqui el ciclo es siempre el mismo y siempre lo cierra el servidor:
 *
 *   apostar(jugada) -> POST /rondas -> el backend cobra, resuelve y devuelve
 *                      la ronda con su desenlace y la billetera actualizada.
 *
 * La animacion de la sala se reproduce **sobre** ese resultado. La ruleta ya
 * sabe en que numero tiene que parar antes de empezar a girar, y eso no es un
 * truco: es la unica forma de que lo que se ve coincida con lo que se cobro.
 *
 * `usePartida` sigue vivo al lado y no es redundante: `resultados_juego` es el
 * resumen del recorrido para el estudio (una fila por sesion y juego) y
 * `rondas_juego` es el historial financiero (una fila por apuesta). Las dos
 * lecturas hacen falta y ninguna sustituye a la otra.
 */

interface EstadoDeSala {
  /** La ronda en curso o la ultima resuelta. */
  ronda: RondaDeJuego | null;
  /** Hay una peticion de apuesta en vuelo. */
  apostando: boolean;
  /** Ultimo error de negocio (saldo insuficiente, apuesta invalida...). */
  error: string | null;
}

export function useSalaDeJuego(slug: SalaConApuesta) {
  const sesionId = useLabStore((s) => s.sesionId);
  const asegurarSesion = useLabStore((s) => s.asegurarSesion);
  const aplicarBilletera = useBalanceStore((s) => s.aplicarBilletera);
  const refrescarSaldo = useBalanceStore((s) => s.refrescar);
  const saldoCargado = useBalanceStore((s) => s.cargado);
  const cargarCatalogo = useCatalogoStore((s) => s.cargar);
  const juego = useCatalogoStore((s) => s.porSlug[slug]);

  // El resultado del laboratorio (telemetria del recorrido) va aparte y no
  // bloquea el juego: si falla, se sigue pudiendo apostar.
  const partida = usePartida(slug);

  const [estado, setEstado] = useState<EstadoDeSala>({
    ronda: null,
    apostando: false,
    error: null,
  });

  const enVuelo = useRef(false);

  useEffect(() => {
    void cargarCatalogo();
  }, [cargarCatalogo]);

  // El saldo se pide una vez al entrar; despues lo actualiza cada respuesta.
  useEffect(() => {
    if (!saldoCargado) void refrescarSaldo();
  }, [saldoCargado, refrescarSaldo]);

  /**
   * Abre una ronda: cobra la apuesta y devuelve el desenlace ya resuelto.
   *
   * `jugada` va en el vocabulario de cada sala (`apuestas` en la ruleta,
   * `lineas` en la tragamonedas, `boleto` en el rasca) y la valida el motor del
   * servidor, que es el unico que conoce las tablas de pago.
   */
  const apostar = useCallback(
    async (jugada: Record<string, unknown>): Promise<RondaDeJuego | null> => {
      // Doble pulsacion: sin esto se abren dos rondas y se cobran las dos.
      if (enVuelo.current) return null;
      enVuelo.current = true;

      setEstado((previo) => ({ ...previo, apostando: true, error: null }));

      try {
        const sesion = sesionId ?? (await asegurarSesion());

        const { ronda, billetera } = await api.rondas.abrir({
          slug,
          jugada,
          sesion_id: sesion ?? undefined,
          // Entropia del jugador: sin ella el servidor seria la unica fuente de
          // azar, y el compromiso probaria menos de lo que parece.
          semilla_cliente: semillaDeCliente(),
        });

        aplicarBilletera(billetera);
        setEstado({ ronda, apostando: false, error: null });

        return ronda;
      } catch (error) {
        const mensaje =
          error instanceof ApiError ? error.message : "No se pudo registrar la apuesta";

        setEstado((previo) => ({ ...previo, apostando: false, error: mensaje }));
        // El saldo pudo cambiar por otra via; se resincroniza para no mostrar
        // una cifra vieja junto a un "saldo insuficiente".
        void refrescarSaldo();
        return null;
      } finally {
        enVuelo.current = false;
      }
    },
    [slug, sesionId, asegurarSesion, aplicarBilletera, refrescarSaldo],
  );

  /** Solo blackjack: un paso mas sobre la mano abierta. */
  const accionar = useCallback(
    async (accion: AccionDeBlackjack): Promise<RondaDeJuego | null> => {
      const actual = estado.ronda;
      if (!actual || actual.estado !== "abierta" || enVuelo.current) return null;

      enVuelo.current = true;
      setEstado((previo) => ({ ...previo, apostando: true, error: null }));

      try {
        const { ronda, billetera } = await api.rondas.accionar(actual.id, accion);

        aplicarBilletera(billetera);
        setEstado({ ronda, apostando: false, error: null });
        return ronda;
      } catch (error) {
        const mensaje =
          error instanceof ApiError ? error.message : "No se pudo aplicar la accion";

        setEstado((previo) => ({ ...previo, apostando: false, error: mensaje }));
        return null;
      } finally {
        enVuelo.current = false;
      }
    },
    [estado.ronda, aplicarBilletera],
  );

  const limpiarError = useCallback(() => {
    setEstado((previo) => ({ ...previo, error: null }));
  }, []);

  return {
    juego: juego ?? null,
    juegoId: juego?.id ?? null,
    ronda: estado.ronda,
    apostando: estado.apostando,
    error: estado.error,
    apostar,
    accionar,
    limpiarError,
    // La telemetria del recorrido, para las salas que la usan.
    partida,
  };
}

/**
 * Entropia que aporta el cliente al compromiso.
 *
 * No hace falta que sea criptografica: su unico trabajo es impedir que el
 * servidor elija su semilla sabiendo de antemano la del jugador. `randomUUID`
 * lo es de todos modos donde existe.
 */
function semillaDeCliente(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
