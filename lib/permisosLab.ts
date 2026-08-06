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
 *   1. `POST /permisos` — el sitio *pidio* el permiso (antes de abrir el dialogo).
 *   2. `PATCH /permisos/:id/respuesta` — como respondio la persona, con el tiempo
 *      que tardo en decidir.
 *
 * Separarlo es lo que permite medir `ms_decision` y, sobre todo, detectar los
 * dialogos que quedan sin contestar: cerrar uno sin responder tambien es un dato.
 * Por eso el paso 1 ocurre siempre, incluso si el navegador no llega a abrir nada.
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
  ok: boolean;
  detalle: string;
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

async function dispararDialogo(
  llave: PermissionKey,
  permisoId: string,
  opciones: OpcionesDePermiso,
): Promise<ResultadoDePermiso> {
  const inicio = performance.now();
  const ms = () => Math.round(performance.now() - inicio);

  switch (llave) {
    case "location": {
      if (!("geolocation" in navigator)) {
        await api.permisos.responder(permisoId, { estado: "ignorado", ms_decision: ms() });
        return { ok: false, detalle: "Geolocalizacion no disponible en este navegador." };
      }

      const posicion = await new Promise<GeolocationPosition | GeolocationPositionError>((resolver) => {
        navigator.geolocation.getCurrentPosition(resolver, resolver, { timeout: 20_000 });
      });
      const msDecision = ms();

      if ("code" in posicion) {
        // TIMEOUT es el dialogo que se quedo abierto sin respuesta: eso es
        // `ignorado`, no `denegado`, y el laboratorio los cuenta por separado.
        const estado = posicion.code === posicion.TIMEOUT ? "ignorado" : "denegado";
        const { permiso } = await api.permisos.responder(permisoId, { estado, ms_decision: msDecision });
        return { ok: false, detalle: `Permiso no concedido: ${posicion.message}`, permiso };
      }

      const { permiso } = await api.permisos.responder(permisoId, {
        estado: "concedido",
        ms_decision: msDecision,
      });

      // Conceder entrega una llave, no un dato: cada lectura se registra aparte.
      const lectura = await api.permisos.registrarUbicacion(permisoId, {
        latitud: posicion.coords.latitude,
        longitud: posicion.coords.longitude,
        precision_m: posicion.coords.accuracy,
        altitud_m: posicion.coords.altitude,
        velocidad_ms: posicion.coords.speed,
        zona_horaria: zonaHoraria(),
      });

      return {
        ok: true,
        detalle:
          `Ubicacion obtenida con ${Math.round(lectura.lectura.precision_m)} m de precision. ` +
          `El servidor no guardo tus coordenadas: solo una celda de ~${lectura.lo_que_se_guarda.celda_aproximada_m} m ` +
          `y el hash de la posicion. ${lectura.alcance.comparacion.lectura}`,
        permiso,
        alcance: lectura.alcance,
        lecturas: lectura.lecturas,
      };
    }

    case "camera":
    case "microphone": {
      const pideVideo = llave === "camera";
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(
          pideVideo ? { video: true } : { audio: true },
        );
      } catch (error) {
        const nombre = error instanceof DOMException ? error.name : "Error";
        // Que no haya dispositivo no es una decision de la persona.
        const estado = nombre === "NotAllowedError" ? "denegado" : "ignorado";
        const msDecision = ms();
        const { permiso } = await api.permisos.responder(permisoId, { estado, ms_decision: msDecision });
        return {
          ok: false,
          detalle:
            nombre === "NotAllowedError"
              ? `Permiso de ${pideVideo ? "camara" : "microfono"} denegado.`
              : `El navegador no pudo abrir el dispositivo (${nombre}).`,
          permiso,
        };
      }

      const msDecision = ms();
      const { permiso } = await api.permisos.responder(permisoId, {
        estado: "concedido",
        ms_decision: msDecision,
      });

      // `pistas` es lo que devolvio getUserMedia, no lo que se pidio: un permiso
      // de camara puede traer audio si se solicito en el mismo dialogo.
      const pistas: PistaMedios[] = [];
      if (stream.getVideoTracks().length) pistas.push("video");
      if (stream.getAudioTracks().length) pistas.push("audio");

      const etiqueta = stream.getTracks()[0]?.label || null;
      const { activacion, indicador } = await api.medios.abrir({
        permiso_id: permisoId,
        pistas: pistas.length ? pistas : [pideVideo ? "video" : "audio"],
        dispositivo: etiqueta,
        dispositivos_visibles: await dispositivosVisibles(),
      });

      if (!opciones.mantenerAbierto) {
        // `track.stop()` es lo unico que libera el dispositivo y apaga el
        // indicador; silenciar no lo haria.
        stream.getTracks().forEach((pista) => pista.stop());
        await api.medios.cerrar(activacion.id).catch(() => undefined);
        return {
          ok: true,
          detalle: `Acceso concedido a "${etiqueta ?? "dispositivo sin nombre"}". Se cerro al instante con track.stop(), que es lo unico que apaga el indicador.`,
          permiso,
          activacionId: activacion.id,
        };
      }

      guardarStream(activacion.id, stream);
      return {
        ok: true,
        detalle: `Acceso concedido a "${etiqueta ?? "dispositivo sin nombre"}". ${indicador.donde_mirar}`,
        permiso,
        activacionId: activacion.id,
      };
    }

    case "notifications": {
      if (!("Notification" in window)) {
        await api.permisos.responder(permisoId, { estado: "ignorado", ms_decision: ms() });
        return { ok: false, detalle: "Notificaciones no soportadas en este navegador." };
      }

      const resultado = await Notification.requestPermission();
      const msDecision = ms();
      // "default" es el dialogo que se cerro sin contestar.
      const estado = resultado === "granted" ? "concedido" : resultado === "denied" ? "denegado" : "ignorado";
      const { permiso } = await api.permisos.responder(permisoId, { estado, ms_decision: msDecision });

      return {
        ok: resultado === "granted",
        detalle: `El navegador respondio "${resultado}" en ${msDecision} ms.`,
        permiso,
      };
    }

    default:
      return { ok: false, detalle: "Este permiso no abre un dialogo del navegador." };
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
  const sesionId = await useLabStore.getState().asegurarSesion();
  if (!sesionId) {
    const detalle = "No hay una sesion de laboratorio abierta. Inicia sesion para empezar el recorrido.";
    sincronizarUi(llave, false, detalle);
    return { ok: false, detalle };
  }

  const tipo = TIPO_EN_LA_API[llave];

  let resultado: ResultadoDePermiso;
  if (tipo === null) {
    resultado =
      llave === "cookies"
        ? await ejercicioDeCookies(sesionId, opciones.juegoId)
        : await ejercicioDeAlmacenamiento(sesionId, opciones.juegoId);
  } else {
    try {
      // Paso 1: queda registrado que el sitio pidio el permiso, respondas o no.
      const { permiso } = await api.permisos.solicitar({
        sesion_id: sesionId,
        juego_id: opciones.juegoId ?? null,
        tipo,
      });
      resultado = await dispararDialogo(llave, permiso.id, opciones);
    } catch (error) {
      resultado = {
        ok: false,
        detalle: error instanceof ApiError ? error.message : "No se pudo registrar el permiso",
      };
    }
  }

  sincronizarUi(llave, resultado.ok, resultado.detalle);
  registrarEvento(
    "permiso_respondido",
    { permiso: llave, concedido: resultado.ok, ms_decision: resultado.permiso?.ms_decision ?? null },
    opciones.juegoId ?? null,
  );

  return resultado;
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

/** `track.stop()`: lo unico que apaga el indicador del navegador. */
export async function cerrarMedios(activacionId: string): Promise<void> {
  const stream = streamsAbiertos.get(activacionId);
  stream?.getTracks().forEach((pista) => pista.stop());
  streamsAbiertos.delete(activacionId);
  await api.medios.cerrar(activacionId).catch(() => undefined);
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
