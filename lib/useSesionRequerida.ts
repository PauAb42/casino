"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "./authStore";

/**
 * Guard de las paginas privadas.
 *
 * Existe por un fallo concreto: media docena de paginas hacian
 * `if (!user) router.replace("/login")` dentro de un `useEffect`. Al refrescar,
 * `user` es `null` durante los milisegundos que tarda `GET /auth/yo` en
 * responder, asi que el guard disparaba la redireccion **antes** de saber si
 * habia sesion. La cookie httpOnly seguia siendo valida y el JWT tambien: el
 * unico que se habia rendido era el frontend.
 *
 * La distincion que faltaba es la que ya modelaba el store en `estado`:
 *
 *   `desconocido` — todavia no respondio `/auth/yo`. **No se decide nada.**
 *   `autenticado` — hay identidad.
 *   `anonimo`     — se pregunto y no hay sesion. Ahora si, a /login.
 *
 * Tenerlo en un hook y no repetido en cada pagina es lo que evita que la
 * proxima pantalla vuelva a mirar `user` a secas.
 */
export function useSesionRequerida() {
  const estado = useAuthStore((s) => s.estado);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    // Solo se expulsa con una respuesta en la mano.
    if (estado === "anonimo") router.replace("/login");
  }, [estado, router]);

  return {
    user,
    estado,
    /** Aun no se sabe: la pagina debe pintar un esqueleto, no redirigir. */
    resolviendo: estado === "desconocido",
    autenticado: estado === "autenticado",
  };
}
