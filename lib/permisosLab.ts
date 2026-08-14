// lib/permisosLab.ts
import { ApiError, api } from "./api";
import type { AlcanceDeUbicacion, Permiso, PistaMedios, TipoPermiso } from "./api";
import { registrarEvento } from "./eventos";
import { useLabStore } from "./labStore";
import type { PermissionKey } from "./store";
import { useZeroTrustStore } from "./store";

/**
 * El laboratorio de permisos: dialogo real del navegador + registro en el backend.
 *
 * El ciclo del backend es de **dos pasos y no uno**, y aqui se respeta:
 *
 *   1. `POST /permisos` — el sitio *pidio* el permiso.
 *   2. `PATCH /permisos/:id/respuesta` — como respondio la persona, con el tiempo
 *      que tardo en decidir.
 *
 * Separarlo es lo que permite medir `ms_decision` y, sobre todo, detectar los
 * dialogos que quedan sin contestar: cerrar uno sin responder tambien es un dato.
 * Por eso el paso 1 ocurre siempre, incluso si el navegador no llega a abrir nada.
 *
 * ## Dos correcciones que estructuran este archivo
 *
 * **El paso 1 va en paralelo al dialogo, no antes.** Esperar la sesion de
 * laboratorio y un POST antes de llamar a `getUserMedia` gastaba la activacion
 * transitoria del clic, y varios navegadores exigen esa activacion para mostrar
 * el dialogo. El resultado era que el navegador podia ignorarlo aunque la
 * persona hubiera pulsado "Permitir". Ahora el dialogo se dispara en el mismo
 * turno del clic y el registro viaja al lado; `ms_decision` se sigue midiendo
 * igual porque el cronometro arranca al abrir el dialogo, no al registrarlo.
 *
 * **El permiso del navegador y el registro son dos condiciones distintas.**
 * Antes se fundian en un solo `ok`, asi que si el navegador concedia y una
 * peticion posterior fallaba, la UI lo mostraba como denegado y bloqueaba la
 * sala. Ahora `ok` es exclusivamente lo que decidio la persona, y el fallo de
 * telemetria viaja en `errorDeRegistro` como aviso. La telemetria no decide
 * quien puede jugar.
 */

/** El vocabulario de la UI no es el del backend: `camera` no existe alla. */
const TIPO_EN_LA_API: Record<PermissionKey, TipoPermiso | null> = {
  camera: "camara",
  microphone: "microfono",
  location: "geolocalizacion",
  notifications: "notificaciones",
  // Cookies y Web Storage no son permisos del navegador: no hay dialogo que
  // medir, y por eso tienen sus propios recursos en la API.
  cookies: null,
  localStorage: null,
};

export interface ResultadoDePermiso {
  /**
   * **Lo que respondio el navegador**, y solo eso.
   *
   * Antes este campo mezclaba dos cosas distintas: la decision de la persona en
   * el dialogo del navegador y el exito de las tres o cuatro peticiones que el
   * laboratorio hace alrededor. Si el navegador concedia y una peticion
   * posterior fallaba, la UI lo convertia en "denegado" y bloqueaba la sala. Esa
   * era la causa directa de conceder el permiso y aun asi no poder entrar.
   *
   * Ahora `ok` responde exactamente a "¿el navegador dijo que si?". El fallo de
   * telemetria viaja aparte, en `errorDeRegistro`, y no bloquea nada.
   */
  ok: boolean;
  detalle: string;
  /**
   * La telemetria fallo, pero el permiso del navegador sigue siendo el que dice
   * `ok`. Se muestra como aviso, nunca como denegacion.
   */
  errorDeRegistro?: string;
  permiso?: Permiso;
  /** Informe "con permiso vs. sin permiso" cuando se concedio la ubicacion. */
  alcance?: AlcanceDeUbicacion;
  /** Activacion abierta de camara/microfono, para poder cerrarla despues. */
  activacionId?: string;
  lecturas?: number;
}

interface OpcionesDePermiso {
  juegoId?: string | null;
  /**
   * Deja la camara/microfono abiertos (el juego los usa). Con `false` se hace
   * `track.stop()` en el acto y se cierra la activacion: es lo unico que libera
   * el dispositivo y apaga el indicador.
   */
  mantenerAbierto?: boolean;
}

function zonaHoraria(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/** Cuantos nombres de dispositivo revela el navegador ahora mismo. */
async function dispositivosVisibles(): Promise<number> {
  try {
    const lista = await navigator.mediaDevices.enumerateDevices();
    // Antes de conceder llegan con `label` vacio: esa diferencia es el ejercicio.
    return lista.filter((d) => d.label).length;
  } catch {
    return 0;
  }
}

function sincronizarUi(llave: PermissionKey, ok: boolean, detalle: string) {
  useZeroTrustStore.getState().setPermission(llave, ok ? "granted" : "denied", detalle);
}

// --------------------------------------------------------------------------
// Cookies y Web Storage: sin dialogo, con recurso propio en la API
// --------------------------------------------------------------------------

async function ejercicioDeCookies(sesionId: string, juegoId?: string | null): Promise<ResultadoDePermiso> {
  try {
    // El backend persiste el registro (con el valor hasheado) y emite el
    // Set-Cookie real: la cookie del laboratorio no va firmada a proposito, para
    // que se pueda abrir el inspector y verla tal cual.
    //
    // Una cookie `persistente` exige `expira_at` en el futuro (una sin fecha es,
    // por definicion, de sesion): 30 dias, que es lo que hace que sobreviva al
    // cierre del navegador y por eso sirve para rastrear entre visitas.
    const treintaDias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const respuesta = await api.cookies.guardar({
      sesion_id: sesionId,
      juego_id: juegoId ?? null,
      nombre: "casino_pref",
      tipo: "persistente",
      proposito: "Recordar tus preferencias de mesa entre visitas al laboratorio",
      valor: `visita-${Date.now()}`,
      http_only_flag: false,
      same_site: "Lax",
      expira_at: treintaDias,
    });

    const advertencias = respuesta.advertencias.length ? ` ${respuesta.advertencias.join(" ")}` : "";
    return {
      ok: true,
      detalle:
        `Cookie "${respuesta.cookie.nombre}" emitida en tu navegador. El servidor solo guardo su ` +
        `huella (${respuesta.cookie.valor_hash.slice(0, 12)}…), nunca el valor.${advertencias}`,
    };
  } catch (error) {
    return {
      ok: false,
      detalle: error instanceof ApiError ? error.message : "No se pudo registrar la cookie",
    };
  }
}

async function ejercicioDeAlmacenamiento(sesionId: string, juegoId?: string | null): Promise<ResultadoDePermiso> {
  try {
    window.localStorage.setItem("casino_visita", new Date().toISOString());
  } catch {
    return { ok: false, detalle: "El navegador bloqueo el almacenamiento local en este contexto." };
  }

  try {
    const { entradas, areas_sincronizadas } = (await import("./fingerprint")).inventarioDelNavegador();
    const respuesta = await api.almacenamiento.sincronizar({
      sesion_id: sesionId,
      juego_id: juegoId ?? null,
      entradas,
      areas_sincronizadas,
    });

    const { resumen } = respuesta;
    return {
      ok: true,
      detalle:
        `Tu navegador tenia ${resumen.total} claves guardadas (${resumen.tecnicas} tecnicas, ` +
        `${resumen.sin_valor_para_ti} que no te sirven a ti). Nadie te pidio permiso para ninguna: ` +
        `localStorage no viaja en las peticiones, asi que esto solo se sabe porque el sitio lo declaro.`,
    };
  } catch (error) {
    return {
      ok: false,
      detalle: error instanceof ApiError ? error.message : "No se pudo sincronizar el inventario",
    };
  }
}

// --------------------------------------------------------------------------
// Permisos con dialogo real
// --------------------------------------------------------------------------

/**
 * ¿Estamos donde el navegador permite pedir estos permisos?
 *
 * Camara, microfono y ubicacion exigen contexto seguro: HTTPS o `localhost`.
 * Abrir el sitio por la IP de la red local lo rompe, y el sintoma es confuso
 * porque no aparece ningun dialogo ni ningun error de permiso.
 */
function esContextoSeguro(): boolean {
  return typeof window !== "undefined" && window.isSecureContext;
}

/**
 * Por que fallo `getUserMedia`, en lenguaje accionable.
 *
 * `NotAllowedError` es el caso que mas desconcierta: si el permiso se denegio
 * una vez, el navegador **recuerda la decision para el origen** y las llamadas
 * siguientes fallan al instante sin mostrar nada. Desde JavaScript no hay forma
 * de volver a preguntar, asi que lo unico util es decir donde se reactiva.
 */
function explicarFalloDeMedios(nombre: string, dispositivo: string): string {
  switch (nombre) {
    case "NotAllowedError":
      return (
        `El navegador tiene bloqueada la ${dispositivo} para este sitio. Si no acabas de ` +
        `rechazarlo, es una decision que quedo guardada de antes: reactivalo en el candado ` +
        `de la barra de direcciones y vuelve a intentarlo.`
      );
    case "NotFoundError":
    case "OverconstrainedError":
      return `No hay ninguna ${dispositivo} disponible en este equipo.`;
    case "NotReadableError":
      return `La ${dispositivo} existe pero otra aplicacion la esta usando.`;
    default:
      return `El navegador no pudo abrir la ${dispositivo} (${nombre}).`;
  }
}

/** Lo que respondio el navegador, antes de que intervenga la telemetria. */
interface DesenlaceDelDialogo {
  estado: "concedido" | "denegado" | "ignorado";
  ok: boolean;
  detalle: string;
  /** Solo en `location`, cuando se concedio. */
  posicion?: GeolocationPosition;
  /** Solo en `camera`/`microphone`, cuando se concedio. */
  stream?: MediaStream;
}

/**
 * Abre el dialogo real del navegador. **No hace ni una peticion de red.**
 *
 * Esa es toda la gracia de tenerlo separado. Varios navegadores solo muestran
 * el dialogo si la llamada ocurre dentro de la activacion transitoria del clic,
 * y esa activacion se pierde en cuanto se hace `await` de algo lento. La version
 * anterior esperaba la sesion de laboratorio y un `POST /permisos` antes de
 * llegar aqui, asi que el navegador podia ignorar el dialogo aunque la persona
 * hubiera pulsado "Permitir".
 *
 * Ahora esto se dispara en el mismo turno que el clic y el registro viaja en
 * paralelo.
 */
function abrirDialogoDelNavegador(llave: PermissionKey): Promise<DesenlaceDelDialogo> {
  switch (llave) {
    case "location": {
      if (!("geolocation" in navigator)) {
        return Promise.resolve({
          estado: "ignorado",
          ok: false,
          detalle: "Geolocalizacion no disponible en este navegador.",
        });
      }

      if (!esContextoSeguro()) {
        return Promise.resolve({
          estado: "ignorado",
          ok: false,
          detalle:
            `El navegador solo entrega la ubicacion en un contexto seguro. Estas en ` +
            `${window.location.origin}: abre el sitio en http://localhost:3001 o por HTTPS.`,
        });
      }

      return new Promise<DesenlaceDelDialogo>((resolver) => {
        navigator.geolocation.getCurrentPosition(
          (posicion) => resolver({ estado: "concedido", ok: true, detalle: "", posicion }),
          (error) =>
            resolver({
              // TIMEOUT es el dialogo que se quedo abierto sin respuesta: eso es
              // `ignorado`, no `denegado`, y el laboratorio los cuenta aparte.
              estado: error.code === error.TIMEOUT ? "ignorado" : "denegado",
              ok: false,
              detalle:
                error.code === error.PERMISSION_DENIED
                  ? "El navegador tiene bloqueada la ubicacion para este sitio. Si no acabas de " +
                    "rechazarla, es una decision que quedo guardada de antes: reactivala en el " +
                    "candado de la barra de direcciones y vuelve a intentarlo."
                  : `Permiso no concedido: ${error.message}`,
            }),
          { timeout: 20_000 },
        );
      });
    }

    case "camera":
    case "microphone": {
      const pideVideo = llave === "camera";
      const dispositivo = pideVideo ? "camara" : "microfono";

      // `navigator.mediaDevices` **no existe** fuera de un contexto seguro. El
      // navegador no lanza un error de permiso: la propiedad simplemente es
      // `undefined`, asi que sin esta guarda el `.getUserMedia` reventaria con
      // un TypeError que no explica nada. Pasa al abrir el sitio por IP de red
      // (`http://192.168.x.x:3001`) en vez de por `localhost`.
      if (!navigator.mediaDevices?.getUserMedia) {
        return Promise.resolve({
          estado: "ignorado",
          ok: false,
          detalle: esContextoSeguro()
            ? `Este navegador no expone la ${dispositivo}.`
            : `El navegador solo permite usar la ${dispositivo} en un contexto seguro. ` +
              `Estas en ${window.location.origin}: abre el sitio en http://localhost:3001 o por HTTPS.`,
        });
      }

      return navigator.mediaDevices
        .getUserMedia(pideVideo ? { video: true } : { audio: true })
        .then((stream) => ({
          estado: "concedido" as const,
          ok: true,
          detalle: "",
          stream,
        }))
        .catch((error: unknown) => {
          const nombre = error instanceof DOMException ? error.name : "Error";

          return {
            // Que no haya dispositivo no es una decision de la persona.
            estado: nombre === "NotAllowedError" ? ("denegado" as const) : ("ignorado" as const),
            ok: false,
            detalle: explicarFalloDeMedios(nombre, dispositivo),
          };
        });
    }

    case "notifications": {
      if (!("Notification" in window)) {
        return Promise.resolve({
          estado: "ignorado",
          ok: false,
          detalle: "Notificaciones no soportadas en este navegador.",
        });
      }

      return Notification.requestPermission().then((resultado) => ({
        // "default" es el dialogo que se cerro sin contestar.
        estado:
          resultado === "granted"
            ? ("concedido" as const)
            : resultado === "denied"
              ? ("denegado" as const)
              : ("ignorado" as const),
        ok: resultado === "granted",
        detalle: `El navegador respondio "${resultado}".`,
      }));
    }

    default:
      return Promise.resolve({
        estado: "ignorado",
        ok: false,
        detalle: "Este permiso no abre un dialogo del navegador.",
      });
  }
}

/**
 * Pide un permiso: lo registra, abre el dialogo real y anota como respondiste.
 *
 * Devuelve siempre un resultado legible, nunca lanza: la UI del recorrido no
 * debe romperse porque alguien diga que no.
 */
export async function pedirPermiso(
  llave: PermissionKey,
  opciones: OpcionesDePermiso = {},
): Promise<ResultadoDePermiso> {
  const tipo = TIPO_EN_LA_API[llave];

  // Cookies y Web Storage no abren dialogo, asi que aqui si se puede esperar a
  // la sesion antes de nada: no hay activacion transitoria que perder.
  if (tipo === null) {
    const sesionId = await useLabStore.getState().asegurarSesion();

    if (!sesionId) {
      const detalle = "No hay una sesion de laboratorio abierta. Inicia sesion para empezar el recorrido.";
      sincronizarUi(llave, false, detalle);
      return { ok: false, detalle };
    }

    const resultado =
      llave === "cookies"
        ? await ejercicioDeCookies(sesionId, opciones.juegoId)
        : await ejercicioDeAlmacenamiento(sesionId, opciones.juegoId);

    sincronizarUi(llave, resultado.ok, resultado.detalle);
    registrarEvento("permiso_respondido", { permiso: llave, concedido: resultado.ok }, opciones.juegoId ?? null);
    return resultado;
  }

  // 1. El dialogo se abre YA, en el mismo turno que el clic. Nada de red antes.
  const inicio = performance.now();
  const dialogo = abrirDialogoDelNavegador(llave);

  // 2. El registro (paso 1 del backend) viaja en paralelo. Sigue ocurriendo
  //    siempre —tambien si el navegador no llega a abrir nada—, que es lo que
  //    permite contar los dialogos que quedan sin contestar.
  const registro = registrarSolicitud(tipo, opciones);

  const desenlace = await dialogo;
  const msDecision = Math.round(performance.now() - inicio);

  // 3. Paso 2 del backend y, si hubo stream, la activacion de medios. Todo esto
  //    es telemetria: puede fallar entero sin cambiar lo que decidio la persona.
  const registrado = await reportarDesenlace({
    llave,
    registro,
    desenlace,
    msDecision,
    opciones,
  });

  const resultado: ResultadoDePermiso = {
    // `ok` es lo que dijo el navegador. Ni mas ni menos: aqui es donde antes se
    // colaba el fallo de red y se convertia en "permiso denegado".
    ok: desenlace.ok,
    detalle: registrado.detalle || desenlace.detalle,
    errorDeRegistro: registrado.errorDeRegistro,
    permiso: registrado.permiso,
    alcance: registrado.alcance,
    activacionId: registrado.activacionId,
    lecturas: registrado.lecturas,
  };

  sincronizarUi(llave, resultado.ok, resultado.detalle);
  registrarEvento(
    "permiso_respondido",
    {
      permiso: llave,
      concedido: resultado.ok,
      ms_decision: msDecision,
      registro_fallido: Boolean(resultado.errorDeRegistro),
    },
    opciones.juegoId ?? null,
  );

  return resultado;
}

/**
 * Paso 1 del backend: "el sitio pidio este permiso".
 *
 * Devuelve `null` en vez de lanzar. Que no se pueda registrar la solicitud es un
 * problema de telemetria, y la telemetria no decide si se puede jugar.
 */
async function registrarSolicitud(
  tipo: TipoPermiso,
  opciones: OpcionesDePermiso,
): Promise<{ permiso: Permiso } | { error: string }> {
  try {
    const sesionId = await useLabStore.getState().asegurarSesion();

    if (!sesionId) {
      return { error: "No hay una sesion de laboratorio abierta: la decision no quedo registrada." };
    }

    return await api.permisos.solicitar({
      sesion_id: sesionId,
      // Se resuelve aqui y no en el render anterior: el catalogo puede haber
      // terminado de cargar durante el dialogo, y con el id viejo el permiso se
      // guardaria con `juego_id` nulo y se perderia la trazabilidad.
      juego_id: opciones.juegoId ?? null,
      tipo,
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "No se pudo registrar el permiso" };
  }
}

/** Todo lo que ocurre despues del dialogo. Su fallo nunca cambia `ok`. */
async function reportarDesenlace({
  llave,
  registro,
  desenlace,
  msDecision,
  opciones,
}: {
  llave: PermissionKey;
  registro: Promise<{ permiso: Permiso } | { error: string }>;
  desenlace: DesenlaceDelDialogo;
  msDecision: number;
  opciones: OpcionesDePermiso;
}): Promise<{
  detalle: string;
  errorDeRegistro?: string;
  permiso?: Permiso;
  alcance?: AlcanceDeUbicacion;
  activacionId?: string;
  lecturas?: number;
}> {
  const solicitud = await registro;

  if ("error" in solicitud) {
    // El dispositivo pudo quedar abierto: si nadie va a usarlo, se libera. Un
    // stream vivo sin activacion registrada es lo peor de los dos mundos.
    if (desenlace.stream && !opciones.mantenerAbierto) {
      desenlace.stream.getTracks().forEach((pista) => pista.stop());
    }

    return { detalle: desenlace.detalle, errorDeRegistro: solicitud.error };
  }

  const permisoId = solicitud.permiso.id;

  try {
    const { permiso } = await api.permisos.responder(permisoId, {
      estado: desenlace.estado,
      ms_decision: msDecision,
    });

    if (!desenlace.ok) {
      return { detalle: desenlace.detalle, permiso };
    }

    if (desenlace.posicion) {
      return { ...(await registrarUbicacionInicial(permisoId, desenlace.posicion)), permiso };
    }

    if (desenlace.stream) {
      return { ...(await registrarActivacion(llave, permisoId, desenlace.stream, opciones)), permiso };
    }

    return { detalle: `${desenlace.detalle} Se registro en ${msDecision} ms.`, permiso };
  } catch (error) {
    if (desenlace.stream && !opciones.mantenerAbierto) {
      desenlace.stream.getTracks().forEach((pista) => pista.stop());
    }

    return {
      detalle: desenlace.detalle,
      errorDeRegistro:
        error instanceof ApiError
          ? error.message
          : "El permiso se concedio, pero no se pudo registrar en el laboratorio.",
    };
  }
}

/** Conceder entrega una llave, no un dato: cada lectura se registra aparte. */
async function registrarUbicacionInicial(permisoId: string, posicion: GeolocationPosition) {
  const lectura = await api.permisos.registrarUbicacion(permisoId, {
    latitud: posicion.coords.latitude,
    longitud: posicion.coords.longitude,
    precision_m: posicion.coords.accuracy,
    altitud_m: posicion.coords.altitude,
    velocidad_ms: posicion.coords.speed,
    zona_horaria: zonaHoraria(),
  });

  return {
    detalle:
      `Ubicacion obtenida con ${Math.round(lectura.lectura.precision_m)} m de precision. ` +
      `El servidor no guardo tus coordenadas: solo una celda de ~${lectura.lo_que_se_guarda.celda_aproximada_m} m ` +
      `y el hash de la posicion. ${lectura.alcance.comparacion.lectura}`,
    alcance: lectura.alcance,
    lecturas: lectura.lecturas,
  };
}

/** Abre la activacion de medios y decide si el dispositivo se queda encendido. */
async function registrarActivacion(
  llave: PermissionKey,
  permisoId: string,
  stream: MediaStream,
  opciones: OpcionesDePermiso,
) {
  // `pistas` es lo que devolvio getUserMedia, no lo que se pidio: un permiso de
  // camara puede traer audio si se solicito en el mismo dialogo.
  const pistas: PistaMedios[] = [];
  if (stream.getVideoTracks().length) pistas.push("video");
  if (stream.getAudioTracks().length) pistas.push("audio");

  const etiqueta = stream.getTracks()[0]?.label || null;

  const { activacion, indicador } = await api.medios.abrir({
    permiso_id: permisoId,
    pistas: pistas.length ? pistas : [llave === "camera" ? "video" : "audio"],
    dispositivo: etiqueta,
    dispositivos_visibles: await dispositivosVisibles(),
  });

  if (!opciones.mantenerAbierto) {
    // `track.stop()` es lo unico que libera el dispositivo y apaga el indicador;
    // silenciar no lo haria.
    stream.getTracks().forEach((pista) => pista.stop());
    await api.medios.cerrar(activacion.id).catch(() => undefined);

    return {
      detalle:
        `Acceso concedido a "${etiqueta ?? "dispositivo sin nombre"}". Se cerro al instante con ` +
        `track.stop(), que es lo unico que apaga el indicador.`,
      activacionId: activacion.id,
    };
  }

  guardarStream(activacion.id, stream);

  return {
    detalle: `Acceso concedido a "${etiqueta ?? "dispositivo sin nombre"}". ${indicador.donde_mirar}`,
    activacionId: activacion.id,
  };
}

/**
 * El "no, gracias" que se responde **antes** de abrir el dialogo del navegador.
 *
 * Se registra igual que cualquier otro desenlace: el sitio pidio el permiso, y
 * que la persona lo corte antes de que el navegador aparezca es una respuesta
 * tan real como la del dialogo. Sin esto, rechazar en la UI del laboratorio no
 * dejaria rastro y el resumen contaria un permiso menos.
 */
export async function rechazarSinAbrirDialogo(
  llave: PermissionKey,
  opciones: OpcionesDePermiso & { msDecision?: number | null } = {},
): Promise<void> {
  const tipo = TIPO_EN_LA_API[llave];
  const detalle = "Rechazado antes de que el navegador mostrara el dialogo.";

  if (tipo !== null) {
    const sesionId = await useLabStore.getState().asegurarSesion();
    if (sesionId) {
      try {
        const { permiso } = await api.permisos.solicitar({
          sesion_id: sesionId,
          juego_id: opciones.juegoId ?? null,
          tipo,
        });
        await api.permisos.responder(permiso.id, {
          estado: "denegado",
          ms_decision: opciones.msDecision ?? null,
        });
      } catch {
        // Que no se pueda registrar el rechazo no debe bloquear la UI.
      }
    }
  }

  sincronizarUi(llave, false, detalle);
  registrarEvento("permiso_rechazado_en_ui", { permiso: llave }, opciones.juegoId ?? null);
}

// --------------------------------------------------------------------------
// Streams abiertos: hay que poder apagarlos de verdad
// --------------------------------------------------------------------------

/**
 * Streams vivos por activacion.
 *
 * Se guardan aqui porque `POST /medios/:id/cierre` registra el cierre pero no
 * puede tocar el dispositivo: sin el `track.stop()` del cliente, el indicador
 * del navegador se quedaria encendido y el informe diria lo contrario de lo que
 * pasa en pantalla.
 */
const streamsAbiertos = new Map<string, MediaStream>();

function guardarStream(activacionId: string, stream: MediaStream) {
  streamsAbiertos.set(activacionId, stream);
}

export function streamDe(activacionId: string): MediaStream | undefined {
  return streamsAbiertos.get(activacionId);
}

/** `track.enabled = false`: corta los datos y **no** libera el dispositivo. */
export async function silenciarMedios(activacionId: string, silenciada: boolean): Promise<void> {
  const stream = streamsAbiertos.get(activacionId);
  stream?.getTracks().forEach((pista) => {
    pista.enabled = !silenciada;
  });
  await api.medios.silenciar(activacionId, silenciada).catch(() => undefined);
}

/**
 * `track.stop()`: lo unico que apaga el indicador del navegador.
 *
 * El orden importa y no es intercambiable: primero se apaga el dispositivo y
 * despues se registra el cierre. Al reves, un fallo de red dejaria la camara
 * encendida mientras la base dice que se cerro.
 *
 * Devuelve si el registro llego a grabarse. Antes esta funcion se tragaba el
 * error en silencio, y por eso la instantanea auditada tenia nueve activaciones
 * "activas" y ninguna finalizada: el dispositivo si se apagaba, pero el registro
 * de privacidad se quedaba mintiendo.
 */
export async function cerrarMedios(activacionId: string): Promise<{ registrado: boolean; error?: string }> {
  const stream = streamsAbiertos.get(activacionId);
  stream?.getTracks().forEach((pista) => pista.stop());
  streamsAbiertos.delete(activacionId);

  try {
    await api.medios.cerrar(activacionId);
    return { registrado: true };
  } catch (error) {
    return {
      registrado: false,
      error:
        error instanceof ApiError
          ? error.message
          : "El dispositivo se libero, pero el cierre no quedo registrado.",
    };
  }
}

/**
 * Cierra todo lo que siguiera abierto.
 *
 * Lo llaman el desmontaje de las salas que abren camara o microfono y el
 * `pagehide` global. Sin esto, salir de la pagina sin pulsar "cerrar" dejaba la
 * activacion abierta en el backend para siempre: el contador de segundos con
 * acceso seguia corriendo contra una sesion que ya no existia.
 *
 * `sendBeacon` no sirve aqui porque el endpoint es un POST autenticado con
 * cookie y cuerpo JSON; lo que si se puede es lanzar los cierres y no esperar.
 */
export async function cerrarTodosLosMedios(): Promise<void> {
  const abiertos = Array.from(streamsAbiertos.keys());

  await Promise.all(abiertos.map((activacionId) => cerrarMedios(activacionId)));
}

/** Cuantas activaciones siguen vivas en este cliente. */
export function activacionesAbiertas(): string[] {
  return Array.from(streamsAbiertos.keys());
}

/** "Lo note": cuanto tardaste en darte cuenta de que estaba abierto. */
export async function notarMedios(activacionId: string, msHastaNotar: number | null): Promise<void> {
  await api.medios.avisar(activacionId, msHastaNotar).catch(() => undefined);
}

/**
 * Una lectura mas bajo un permiso ya concedido.
 *
 * Es la demostracion central: `watchPosition` lee cuantas veces quiera sin
 * volver a preguntar, y el contador de lecturas frente al de dialogos lo ensena.
 */
export async function registrarLecturaDeUbicacion(
  permisoId: string,
  posicion: GeolocationPosition,
): Promise<number | null> {
  try {
    const respuesta = await api.permisos.registrarUbicacion(permisoId, {
      latitud: posicion.coords.latitude,
      longitud: posicion.coords.longitude,
      precision_m: posicion.coords.accuracy,
      altitud_m: posicion.coords.altitude,
      velocidad_ms: posicion.coords.speed,
      zona_horaria: zonaHoraria(),
    });
    return respuesta.lecturas;
  } catch {
    return null;
  }
}

/** Retira la llave. Solo se puede sobre un permiso concedido (422 si no). */
export async function revocarPermiso(permisoId: string): Promise<string | null> {
  try {
    const respuesta = await api.permisos.revocar(permisoId);
    return respuesta.mensaje;
  } catch (error) {
    return error instanceof ApiError ? error.message : null;
  }
}

// --------------------------------------------------------------------------
// Rehidratacion: que permisos ya estaban concedidos
// --------------------------------------------------------------------------

/** Lo que sabemos del permiso al montar una sala, sin abrir ningun dialogo. */
export interface EstadoDePermiso {
  /** Lo que dice el navegador ahora mismo. */
  navegador: PermissionState | "desconocido";
  /** Si el laboratorio ya tenia un permiso concedido de este tipo en la sesion. */
  registradoEnBackend: boolean;
  /** Id del permiso concedido, para poder releer la ubicacion sin volver a pedirla. */
  permisoId: string | null;
  /** Se puede entrar sin volver a preguntar. */
  concedido: boolean;
}

/**
 * Consulta el estado real de un permiso, sin abrir dialogo.
 *
 * Blackjack y Mesa en Vivo inicializaban su estado en `prompt` en cada montaje,
 * asi que al refrescar o volver a la sala volvian a exigir una autorizacion que
 * el navegador ya tenia concedida. Se preguntan las dos fuentes porque
 * responden cosas distintas y las dos importan:
 *
 *   - **La Permissions API** dice si el navegador volveria a preguntar. Es lo
 *     que decide si hay que mostrar la pantalla de bloqueo.
 *   - **El backend** dice si esta sesion de laboratorio ya tiene el permiso
 *     registrado, que es lo que hace falta para releer la ubicacion o
 *     reconstruir el informe final.
 *
 * Ninguna de las dos sustituye a la otra: el navegador no sabe nada del estudio,
 * y el estudio no puede ver la configuracion del navegador.
 */
export async function consultarEstadoDePermiso(llave: PermissionKey): Promise<EstadoDePermiso> {
  const tipo = TIPO_EN_LA_API[llave];

  const [navegador, registro] = await Promise.all([
    estadoEnElNavegador(llave),
    tipo === null ? Promise.resolve(null) : buscarPermisoConcedido(tipo),
  ]);

  return {
    navegador,
    registradoEnBackend: registro !== null,
    permisoId: registro,
    // Basta con que el navegador lo tenga concedido: exigir ademas el registro
    // volveria a atar el acceso a la telemetria, que es el fallo que se corrigio.
    concedido: navegador === "granted",
  };
}

/** `navigator.permissions` no cubre todo ni existe en todos los navegadores. */
async function estadoEnElNavegador(llave: PermissionKey): Promise<PermissionState | "desconocido"> {
  if (llave === "notifications") {
    if (typeof window === "undefined" || !("Notification" in window)) return "desconocido";
    // `Notification.permission` es sincrono y fiable en todos los navegadores.
    return Notification.permission === "default" ? "prompt" : Notification.permission;
  }

  const nombre: Record<string, PermissionName> = {
    camera: "camera" as PermissionName,
    microphone: "microphone" as PermissionName,
    location: "geolocation" as PermissionName,
  };

  const consultable = nombre[llave];
  if (!consultable || typeof navigator === "undefined" || !navigator.permissions) return "desconocido";

  try {
    const estado = await navigator.permissions.query({ name: consultable });
    return estado.state;
  } catch {
    // Safari no soporta `camera`/`microphone` en Permissions API: se responde
    // "desconocido" y la sala pregunta, que es el comportamiento seguro.
    return "desconocido";
  }
}

/** El permiso concedido de este tipo en la sesion actual, si lo hay. */
async function buscarPermisoConcedido(tipo: TipoPermiso): Promise<string | null> {
  const sesionId = useLabStore.getState().sesionId;
  if (!sesionId) return null;

  try {
    const { permisos } = await api.permisos.listar(sesionId, { estado: "concedido", tipo });
    return permisos[0]?.id ?? null;
  } catch {
    // Que no se pueda consultar no debe bloquear la sala.
    return null;
  }
}
