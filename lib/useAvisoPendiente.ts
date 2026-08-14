"use client";

import { useLabStore } from "./labStore";

/**
 * ¿El aviso de privacidad está tapando la pantalla ahora mismo?
 *
 * `ConsentBanner` es un modal a pantalla completa (`fixed inset-0 z-[70]`) que
 * **intercepta cualquier clic** hasta que se responde. Eso es deliberado: el
 * consentimiento es la primera lección del laboratorio y la base legal de toda
 * la captura, así que no puede saltarse.
 *
 * El problema aparecía al combinarlo con las peticiones de permiso de las salas.
 * Cuando esas peticiones eran muros a pantalla completa (`z-[100]`) quedaban por
 * encima del aviso y se podían pulsar. Al convertirlas en banners dentro de la
 * página —para que rechazar un permiso dejara de bloquear el acceso al juego—
 * pasaron a estar **debajo** del modal: el botón "Permitir ubicación" se veía
 * perfectamente, se podía enfocar, y al hacer clic no pasaba absolutamente nada,
 * porque el evento nunca llegaba hasta él.
 *
 * Un botón que no puede funcionar tiene que parecer que no puede funcionar. Con
 * esto las salas lo deshabilitan y explican qué falta, en vez de tragarse el
 * clic en silencio.
 */
export function useAvisoPendiente(): boolean {
  const consultado = useLabStore((s) => s.consentimientoConsultado);
  const consentimiento = useLabStore((s) => s.consentimiento);

  // Mientras no se haya consultado no se afirma nada: dar por pendiente algo que
  // quizá ya está respondido deshabilitaría el botón sin motivo.
  if (!consultado) return false;

  return consentimiento === null;
}
