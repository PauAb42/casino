# Frontend del laboratorio CASINO

Next.js 14 (App Router) + TypeScript + Tailwind + Zustand. Es la mitad visible
del laboratorio: la interfaz de casino con la que se juega y, al final del
recorrido, el informe de todo lo que el sitio pudo recolectar por el camino.

El backend vive en un repositorio aparte y documenta sus endpoints en su propio
README.

## Puesta en marcha

```bash
npm install
npm run dev      # http://localhost:3001
npm run build    # compilacion de produccion; debe terminar sin errores de lint
npm run lint
```

**El frontend corre en el 3001, no en el 3000.** El 3000 lo ocupa el backend, y
arrancar los dos ahi hace que el segundo falle o —peor— que el primero conteste
peticiones que no son suyas.

| Servicio | URL |
| --- | --- |
| Frontend | http://localhost:3001 |
| Backend | http://localhost:3000 |
| Sonda del backend | http://localhost:3000/health |

## Configuracion

`.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Y en el backend, `CORS_ORIGIN` **tiene que declarar el origen exacto**
(`http://localhost:3001`). No es un detalle de configuracion: la sesion viaja en
una cookie httpOnly y el navegador rechaza las peticiones con credenciales
contra un `Access-Control-Allow-Origin: *`. Con el comodin, el login parece
funcionar y la sesion se cae en el primer refresco.

## Como esta organizado

| Necesitas | Mira en |
| --- | --- |
| Pantallas | `app/` (App Router, una carpeta por ruta) |
| Salas de juego | `app/juegos/` |
| Cliente HTTP y tipos de la API | `lib/api/` |
| Estado global | `lib/*Store.ts` (Zustand) |
| Permisos del navegador + registro en backend | `lib/permisosLab.ts` |
| Rondas de apuesta contra el servidor | `lib/useSalaDeJuego.ts` |
| Guard de paginas privadas | `lib/useSesionRequerida.ts` |

## Decisiones que conviene no deshacer

- **El saldo no vive en el cliente.** `balanceStore` es un espejo de solo lectura
  de `GET /billetera`; no expone ningun `setBalance(n)`. El saldo solo cambia
  como consecuencia de una operacion del backend, que responde con la billetera
  ya actualizada. Un saldo que el navegador pueda escribir es un saldo que
  cualquiera reescribe desde la consola, y que un refresco devuelve a su valor
  inicial.

- **Los resultados de juego no se calculan aqui.** Ninguna sala decide si gana
  ni cuanto paga: se abre una ronda con `POST /rondas` y el servidor devuelve el
  desenlace. La animacion se reproduce **sobre** ese resultado, no al reves.
  Cada ronda trae un comprobante (`equidad`) con el que se puede recalcular la
  partida y comprobar que el servidor no la reescribio despues de ver la
  apuesta.

- **`estado`, no `user`, decide si expulsar a `/login`.** Al refrescar, `user` es
  `null` durante los milisegundos que tarda `GET /auth/yo`; mirar `user` a secas
  expulsa a quien tenia sesion valida. Para eso esta `useSesionRequerida()`, que
  distingue "todavia no lo se" de "pregunte y no hay nadie".

- **El token vive en memoria, nunca en `localStorage`.** Lo que sobrevive al
  refresco es la cookie httpOnly del backend. Guardar el JWT donde lo lea un
  script seria la via comoda y justamente la que este laboratorio ensena a
  desconfiar.

- **Un permiso concedido desbloquea el juego aunque falle la telemetria.** El
  dialogo del navegador y el registro en el backend son dos cosas distintas y se
  reportan por separado: si el navegador dijo que si, se juega, y el fallo de
  red se muestra como aviso y no como denegacion.
