// lib/usePartida.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api } from "./api";
import type { ResultadoDeJuego } from "./api";
import { useCatalogoStore } from "./catalogoStore";
import { registrarEvento } from "./eventos";
import { useLabStore } from "./labStore";

/**
 * El resultado de un juego dentro de la sesion.
 *
 * `resultados` es unico por `(sesion_id, juego_id)`: un juego se juega una vez
 * por sesion y el ciclo es **iniciar -> progreso -> completar** sobre la misma
 * fila. Por eso `iniciar()` trata el 409 como "ya estaba empezado" y recupera la
 * fila existente en vez de fallar: volver a entrar a la sala no es un error.
 *
 * Completar es irreversible (`POST /resultados/:id/completado`, 422 al segundo
 * intento), asi que el hook lo expone aparte y nunca lo dispara solo.
 */
export function usePartida(slug: string) {
  const asegurarSesion = useLabStore((s) => s.asegurarSesion);
  const cargarCatalogo = useCatalogoStore((s) => s.cargar);
  const juego = useCatalogoStore((s) => s.porSlug[slug]);

  const [resultado, setResultado] = useState<ResultadoDeJuego | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const iniciado = useRef(false);

  useEffect(() => {
    void cargarCatalogo();
  }, [cargarCatalogo]);

  /** Abre (o recupera) el resultado de esta sala. Idempotente por diseno. */
  const iniciar = useCallback(
    async (metricas: Record<string, unknown> = {}) => {
      if (iniciado.current || !juego) return null;
      iniciado.current = true;
      setIniciando(true);

      const sesionId = await asegurarSesion();
      if (!sesionId) {
        setIniciando(false);
        iniciado.current = false;
        return null;
      }

      try {
        const { resultado: nuevo } = await api.resultados.iniciar({
          sesion_id: sesionId,
          juego_id: juego.id,
          metricas,
        });
        setResultado(nuevo);
        registrarEvento("partida_iniciada", { slug }, juego.id);
        return nuevo;
      } catch (error) {
        if (error instanceof ApiError && error.codigo === "CONFLICTO") {
          // Ya se habia empezado en esta sesion: se recupera la fila.
          const { resultados } = await api.resultados.listar(sesionId);
          const previo = resultados.find((r) => r.juego_id === juego.id) ?? null;
          setResultado(previo);
          return previo;
        }
        iniciado.current = false;
        return null;
      } finally {
        setIniciando(false);
      }
    },
    [asegurarSesion, juego, slug],
  );

  /** Progreso parcial. 422 si el resultado ya se completo: no se reabre. */
  const registrarProgreso = useCallback(
    async (puntaje?: number, metricas?: Record<string, unknown>) => {
      if (!resultado || resultado.completado) return;
      try {
        const { resultado: actualizado } = await api.resultados.progreso(resultado.id, {
          puntaje,
          metricas,
        });
        setResultado(actualizado);
      } catch {
        // El progreso es informativo: que falle no debe cortar la partida.
      }
    },
    [resultado],
  );

  /** Cierre irreversible: congela el puntaje del informe. */
  const completar = useCallback(
    async (puntaje?: number, metricas?: Record<string, unknown>) => {
      if (!resultado || resultado.completado) return;
      try {
        const { resultado: cerrado } = await api.resultados.completar(resultado.id, { puntaje, metricas });
        setResultado(cerrado);
        registrarEvento("partida_completada", { slug, puntaje: cerrado.puntaje }, resultado.juego_id);
      } catch {
        // Completar dos veces responde 422; no hay nada que reintentar.
      }
    },
    [resultado, slug],
  );

  /**
   * Cierre automático al salir de la sala.
   *
   * Las cinco salas registraban progreso y **ninguna llamaba a `completar()`**:
   * la instantánea auditada tenía tres resultados y los tres en
   * `completado = false`. Las sesiones quedaban abiertas para siempre y los
   * informes no reflejaban un solo final de partida.
   *
   * Está aquí y no en cada página por un motivo concreto además de no repetirlo:
   * hacerlo en la página con `useEffect(..., [completar])` **cierra la partida
   * antes de tiempo**. `completar` es un `useCallback` que depende de
   * `resultado`, así que cambia de identidad en cuanto se registra el primer
   * progreso; React ejecuta entonces la limpieza del efecto anterior y la
   * partida se completa a mitad del recorrido, dejando el resto del progreso
   * rechazado con 422.
   *
   * El ref esquiva eso: guarda siempre la versión vigente y el efecto se monta
   * una sola vez, así que la limpieza solo corre al desmontar de verdad.
   */
  const completarRef = useRef(completar);
  completarRef.current = completar;

  useEffect(() => {
    return () => {
      void completarRef.current();
    };
  }, []);

  return {
    juego: juego ?? null,
    juegoId: juego?.id ?? null,
    resultado,
    iniciando,
    iniciar,
    registrarProgreso,
    completar,
  };
}
