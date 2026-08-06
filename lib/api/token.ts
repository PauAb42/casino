// lib/api/token.ts
/**
 * Donde vive el token entre peticiones.
 *
 * Es un modulo suelto y no parte del cliente ni del store a proposito: el
 * cliente HTTP necesita leer el token y el store de autenticacion necesita
 * escribirlo, y si uno importara al otro habria un ciclo.
 *
 * El token se queda **en memoria** y nunca en `localStorage`: el backend emite
 * ademas una cookie httpOnly firmada (`casino_sesion`), que es la que sobrevive
 * a un refresco de la pagina sin quedar expuesta a XSS. Al recargar, la sesion
 * se rehidrata con `GET /auth/yo` gracias a esa cookie.
 */

let tokenEnMemoria: string | null = null;

export function guardarToken(token: string | null) {
  tokenEnMemoria = token;
}

export function leerToken(): string | null {
  return tokenEnMemoria;
}
