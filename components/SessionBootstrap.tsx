"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { useBalanceStore } from "@/lib/balanceStore";
import { useLabStore } from "@/lib/labStore";
import { registrarEvento, vaciarEventos } from "@/lib/eventos";
import { cerrarTodosLosMedios } from "@/lib/permisosLab";

/**
 * Arranque del recorrido.
 *
 * Monta una sola vez en el layout y encadena lo que el backend espera al
 * principio de todo:
 *
 *   GET  /auth/yo    — quien eres (con la cookie httpOnly; sobrevive al refresco)
 *   POST /sesiones   — abre la sesion de laboratorio y registra la huella
 *   POST /almacenamiento — declara lo que ya habia en tu navegador
 *
 * No pinta nada: solo deja el estado listo para el resto de las paginas.
 */
export default function SessionBootstrap() {
  const rehidratar = useAuthStore((s) => s.rehidratar);
  const estado = useAuthStore((s) => s.estado);
  const asegurarSesion = useLabStore((s) => s.asegurarSesion);
  const sesionId = useLabStore((s) => s.sesionId);
  const ruta = usePathname();

  // 1. Identidad. Corre siempre, tambien para el visitante anonimo: la respuesta
  //    401 es la que confirma que no hay sesion, y sin preguntarlo el front no
  //    podria distinguir "no ha entrado" de "todavia no lo se".
  useEffect(() => {
    void rehidratar();
  }, [rehidratar]);

  // 2. Sesion de laboratorio, en cuanto hay identidad.
  useEffect(() => {
    if (estado !== "autenticado") return;
    void asegurarSesion();
  }, [estado, asegurarSesion]);

  // 3. Inventario del navegador: es el unico grupo de captura que el servidor no
  //    puede medir por si mismo, asi que si el cliente no lo declara, no existe.
  useEffect(() => {
    if (!sesionId) return;
    void useLabStore.getState().sincronizarAlmacenamiento();
  }, [sesionId]);

  // 4. Traza de navegacion. Un evento por pantalla, en lote.
  useEffect(() => {
    if (!sesionId || !ruta) return;
    registrarEvento("navegacion", { ruta });
  }, [ruta, sesionId]);

  // 5. El saldo, en cuanto hay identidad. Se pide una sola vez aqui y despues lo
  //    mantiene al dia cada respuesta de apuesta, deposito o retiro: pedirlo en
  //    cada componente que lo muestra multiplicaria las peticiones sin motivo.
  useEffect(() => {
    if (estado !== "autenticado") return;
    void useBalanceStore.getState().refrescar();
  }, [estado]);

  // 6. Al cerrar la pestana se vacia la cola de eventos y se sueltan los medios
  //    que siguieran abiertos.
  //
  //    Lo segundo importa mas de lo que parece: sin esto, salir de la pagina con
  //    el microfono abierto dejaba la activacion viva en el backend para
  //    siempre. El informe de privacidad decia "9 activas, ninguna finalizada"
  //    mientras el dispositivo llevaba rato liberado por el propio navegador.
  useEffect(() => {
    const alSalir = () => {
      void vaciarEventos();
      void cerrarTodosLosMedios();
    };
    window.addEventListener("pagehide", alSalir);
    return () => window.removeEventListener("pagehide", alSalir);
  }, []);

  return null;
}
