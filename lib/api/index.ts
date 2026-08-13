// lib/api/index.ts
import { pedir, salud } from "./client";
import type {
  AccionDeBlackjack,
  ActivacionDeMedios,
  AlcanceDeUbicacion,
  Billetera,
  Consentimiento,
  DetalleDeTorneo,
  EstadoDeCaja,
  InscripcionDeTorneo,
  MovimientoDeBilletera,
  Promocion,
  ReclamoDePromocion,
  RespuestaDeRonda,
  ResumenDeJuego,
  RondaDeJuego,
  SalaConApuesta,
  TipoDeMovimiento,
  Torneo,
  CookieDelLaboratorio,
  Cuenta,
  DatoPasivo,
  EntradaASincronizar,
  EntradaDeAuditoria,
  EstadoActivacion,
  EstadoParticipante,
  EstadoPermiso,
  EstadoSesion,
  HuellaDelEstudio,
  NivelRiesgo,
  EventoAEnviar,
  EventoDelNavegador,
  Identidad,
  IndicadorDeMedios,
  InformeDeInferencia,
  InventarioDeAlmacenamiento,
  InventarioDeCookies,
  InventarioDeDatosPasivos,
  InventarioDeMedios,
  InventarioDeMisDatos,
  InventarioDePermisos,
  InventarioDeResultados,
  InventarioDeRespuestas,
  Juego,
  Paginacion,
  Participante,
  Permiso,
  PistaMedios,
  PoliticaDeContrasena,
  PosicionAReportar,
  RangoEdad,
  ReciboDeBorrado,
  RespuestaAbrirSesion,
  RespuestaAlDialogo,
  RespuestaCapturarDato,
  RespuestaDeConcientizacion,
  RespuestaDeLogin,
  RespuestaDeRegistro,
  RespuestaGuardarCookie,
  RespuestaLecturaUbicacion,
  RespuestaRevocarPermiso,
  RespuestaSincronizarAlmacenamiento,
  ResultadoDeJuego,
  Riesgo,
  Rol,
  SameSite,
  SenalesDeHuella,
  SenalesDelCliente,
  Sesion,
  TipoCookie,
  TipoPermiso,
  UsuarioDelPadron,
} from "./types";

/**
 * Los 83 endpoints del backend, agrupados igual que su router.
 *
 * Cada funcion es una linea porque toda la politica (token, cookie, errores,
 * query) ya la resolvio `client.ts`. Lo unico que aportan aqui es el tipo de la
 * respuesta y el nombre del recurso.
 */

// --------------------------------------------------------------------------
// Autenticacion
// --------------------------------------------------------------------------

export const auth = {
  /** Publico: el formulario de registro necesita la politica antes de la cuenta. */
  politica: () => pedir<PoliticaDeContrasena>("/auth/politica", { publica: true }),

  registro: (cuerpo: { alias: string; rango_edad: RangoEdad; correo: string; contrasena: string }) =>
    pedir<RespuestaDeRegistro>("/auth/registro", { metodo: "POST", cuerpo, publica: true }),

  /**
   * Devuelve el token por JSON y por cookie httpOnly a la vez.
   *
   * `recordarme` decide la duracion de las dos: con el, treinta dias y una
   * sesion que sobrevive al cierre del navegador; sin el, una hora. La duracion
   * la fija el servidor y viaja firmada dentro del token, asi que el cliente no
   * puede concederse una sesion mas larga de la que le toca.
   */
  login: (cuerpo: { correo: string; contrasena: string; recordarme?: boolean }) =>
    pedir<RespuestaDeLogin>("/auth/login", { metodo: "POST", cuerpo, publica: true }),

  /**
   * "Olvide mi contrasena". Responde 202 y **siempre lo mismo**, exista o no la
   * cuenta: si la respuesta cambiara, el formulario seria un comprobador de
   * correos registrados.
   */
  solicitarRecuperacion: (correo: string) =>
    pedir<{ mensaje: string }>("/auth/recuperacion", {
      metodo: "POST",
      cuerpo: { correo },
      publica: true,
    }),

  /**
   * Consume el enlace y cambia la contrasena. No devuelve token ni inicia
   * sesion: cambiar la clave y entrar son dos actos distintos.
   */
  restablecerContrasena: (cuerpo: { token: string; contrasena: string }) =>
    pedir<{ mensaje: string }>("/auth/recuperacion/confirmacion", {
      metodo: "POST",
      cuerpo,
      publica: true,
    }),

  logout: () => pedir<void>("/auth/logout", { metodo: "POST" }),

  /** El rol se lee de la base en esta misma peticion, no del token. */
  yo: () => pedir<Identidad>("/auth/yo"),
};

// --------------------------------------------------------------------------
// Usuarios
// --------------------------------------------------------------------------

export const usuarios = {
  /** Padrón paginado. Solo investigador o admin. */
  padron: (
    consulta: {
      limite?: number;
      desplazamiento?: number;
      estado?: EstadoParticipante;
      busqueda?: string;
      incluir_anonimizados?: boolean;
    } = {},
  ) => pedir<{ usuarios: UsuarioDelPadron[]; paginacion: Paginacion }>("/usuarios", { consulta }),

  obtener: (id: string) => pedir<Identidad>(`/usuarios/${id}`),

  actualizar: (id: string, cuerpo: { alias?: string; rango_edad?: RangoEdad }) =>
    pedir<{ participante: Participante }>(`/usuarios/${id}`, { metodo: "PATCH", cuerpo }),

  /** Solo admin. Surte efecto en la siguiente petición del afectado. */
  cambiarRol: (id: string, rol: Rol) =>
    pedir<{ cuenta: Cuenta }>(`/usuarios/${id}/rol`, { metodo: "PATCH", cuerpo: { rol } }),

  /** Solo admin. Desactivar bloquea el login y las peticiones al instante. */
  cambiarEstado: (id: string, activa: boolean) =>
    pedir<{ cuenta: Cuenta }>(`/usuarios/${id}/estado`, { metodo: "PATCH", cuerpo: { activa } }),

  /** No borra: anonimiza. Los resultados se conservan disociados. */
  anonimizar: (id: string) =>
    pedir<{ participante: Participante; mensaje: string }>(`/usuarios/${id}`, { metodo: "DELETE" }),
};

// --------------------------------------------------------------------------
// Catalogos
// --------------------------------------------------------------------------

export const juegos = {
  listar: (consulta: { limite?: number; desplazamiento?: number; solo_activos?: boolean; busqueda?: string } = {}) =>
    pedir<{ juegos: Juego[]; paginacion: Paginacion }>("/juegos", { consulta }),

  /** El slug es la referencia natural desde el frontend. */
  porSlug: (slug: string) => pedir<{ juego: Juego }>(`/juegos/slug/${encodeURIComponent(slug)}`),

  porId: (id: string) => pedir<{ juego: Juego }>(`/juegos/${id}`),

  /** Alta. Solo admin: los catálogos son configuración, no datos del estudio. */
  crear: (cuerpo: {
    slug: string;
    nombre: string;
    descripcion: string;
    tecnologia_demo: string;
    instrucciones_seguridad: string;
    orden: number;
    activo?: boolean;
  }) => pedir<{ juego: Juego }>("/juegos", { metodo: "POST", cuerpo }),

  /** El `slug` no se puede cambiar: es la referencia pública de la sala. */
  actualizar: (
    id: string,
    cuerpo: Partial<{
      nombre: string;
      descripcion: string;
      tecnologia_demo: string;
      instrucciones_seguridad: string;
      orden: number;
      activo: boolean;
    }>,
  ) => pedir<{ juego: Juego }>(`/juegos/${id}`, { metodo: "PATCH", cuerpo }),

  /** 409 si el juego ya tiene resultados: no se borra lo que sostiene datos. */
  eliminar: (id: string) => pedir<{ juego: Juego; eliminado: boolean }>(`/juegos/${id}`, { metodo: "DELETE" }),
};

export const riesgos = {
  listar: (
    consulta: {
      limite?: number;
      desplazamiento?: number;
      solo_activos?: boolean;
      busqueda?: string;
      nivel?: string;
      categoria?: string;
    } = {},
  ) => pedir<{ riesgos: Riesgo[]; paginacion: Paginacion }>("/riesgos", { consulta }),

  porCodigo: (codigo: string) => pedir<{ riesgo: Riesgo }>(`/riesgos/codigo/${encodeURIComponent(codigo)}`),

  /** Alta. Solo admin, igual que los juegos. */
  crear: (cuerpo: {
    codigo: string;
    categoria: string;
    nivel: NivelRiesgo;
    titulo: string;
    descripcion: string;
    recomendacion: string;
    activo?: boolean;
  }) => pedir<{ riesgo: Riesgo }>("/riesgos", { metodo: "POST", cuerpo }),

  /** El `codigo` es inmutable: lo citan los informes y las respuestas. */
  actualizar: (
    id: string,
    cuerpo: Partial<{
      categoria: string;
      nivel: NivelRiesgo;
      titulo: string;
      descripcion: string;
      recomendacion: string;
      activo: boolean;
    }>,
  ) => pedir<{ riesgo: Riesgo }>(`/riesgos/${id}`, { metodo: "PATCH", cuerpo }),

  eliminar: (id: string) => pedir<{ riesgo: Riesgo; eliminado: boolean }>(`/riesgos/${id}`, { metodo: "DELETE" }),
};

// --------------------------------------------------------------------------
// Sesion de laboratorio
// --------------------------------------------------------------------------

export const sesiones = {
  /** Primer paso tras el login: registra la huella y dice si eres recurrente. */
  abrir: (huella: SenalesDeHuella) =>
    pedir<RespuestaAbrirSesion>("/sesiones", { metodo: "POST", cuerpo: { huella } }),

  listar: (consulta: { limite?: number; desplazamiento?: number; estado?: EstadoSesion } = {}) =>
    pedir<{ sesiones: Sesion[]; paginacion: Paginacion }>("/sesiones", { consulta }),

  obtener: (id: string) => pedir<{ sesion: Sesion }>(`/sesiones/${id}`),

  /** `finalizada` (termino el recorrido) o `abandonada` (lo dejo a medias). */
  cerrar: (id: string, motivo: "finalizada" | "abandonada" = "finalizada") =>
    pedir<{ sesion: Sesion }>(`/sesiones/${id}/cierre`, { metodo: "POST", cuerpo: { motivo } }),

  eliminar: (id: string) =>
    pedir<{ sesion: Sesion; eliminado: boolean; en_cascada: Record<string, number> }>(`/sesiones/${id}`, {
      metodo: "DELETE",
    }),
};

// --------------------------------------------------------------------------
// Consentimiento: la base legal de toda la captura
// --------------------------------------------------------------------------

export const consentimientos = {
  registrar: (cuerpo: {
    sesion_id: string;
    version_aviso: string;
    aceptado: boolean;
    alcance: Record<string, unknown>;
    /** Admite null: un 0 es "respondio al instante", no "no se midio". */
    ms_decision: number | null;
  }) => pedir<{ consentimiento: Consentimiento }>("/consentimientos", { metodo: "POST", cuerpo }),

  obtener: (sesion_id: string) =>
    pedir<{ consentimiento: Consentimiento }>("/consentimientos", { consulta: { sesion_id } }),

  /** Reconsiderar conserva el `ms_decision` de la primera decision. */
  reconsiderar: (cuerpo: { sesion_id: string; aceptado: boolean; alcance?: Record<string, unknown> }) =>
    pedir<{ consentimiento: Consentimiento }>("/consentimientos", { metodo: "PATCH", cuerpo }),

  /** Revocar no borra: deja constancia de que hubo consentimiento y se retiro. */
  revocar: (sesion_id: string) =>
    pedir<{ consentimiento: Consentimiento; mensaje: string }>("/consentimientos/revocacion", {
      metodo: "POST",
      cuerpo: { sesion_id },
    }),
};

// --------------------------------------------------------------------------
// Inferencia pasiva (publica: mirar no es recolectar)
// --------------------------------------------------------------------------

export const inferenciaPasiva = {
  /** Solo lo que llego en las cabeceras: ni un byte de JavaScript. */
  cabeceras: () => pedir<InformeDeInferencia>("/inferencia-pasiva", { publica: true }),

  /** POST porque el cuerpo trae senales, no porque cree nada: no toca una fila. */
  informe: (senales: SenalesDelCliente = {}) =>
    pedir<InformeDeInferencia>("/inferencia-pasiva", { metodo: "POST", cuerpo: senales, publica: true }),
};

// --------------------------------------------------------------------------
// Cookies: se registra el rastro y se emite la cookie de verdad
// --------------------------------------------------------------------------

export const cookies = {
  guardar: (cuerpo: {
    sesion_id: string;
    juego_id?: string | null;
    nombre: string;
    tipo: TipoCookie;
    proposito: string;
    valor: string;
    secure_flag?: boolean;
    http_only_flag?: boolean;
    same_site?: SameSite;
    expira_at?: string | null;
  }) => pedir<RespuestaGuardarCookie>("/cookies", { metodo: "POST", cuerpo }),

  listar: (sesion_id: string, incluir_eliminadas = false) =>
    pedir<InventarioDeCookies>("/cookies", { consulta: { sesion_id, incluir_eliminadas } }),

  eliminar: (id: string) =>
    pedir<{ cookie: CookieDelLaboratorio; eliminada_en_navegador: boolean }>(`/cookies/${id}`, {
      metodo: "DELETE",
    }),
};

// --------------------------------------------------------------------------
// Almacenamiento del navegador: auto-declarado, no observado
// --------------------------------------------------------------------------

export const almacenamiento = {
  /** Sincroniza el inventario completo (no da de alta una clave). */
  sincronizar: (cuerpo: {
    sesion_id: string;
    juego_id?: string | null;
    entradas: EntradaASincronizar[];
    areas_sincronizadas?: Array<"local" | "sesion">;
  }) => pedir<RespuestaSincronizarAlmacenamiento>("/almacenamiento", { metodo: "POST", cuerpo }),

  listar: (sesion_id: string, consulta: { area?: string; categoria?: string; incluir_eliminadas?: boolean } = {}) =>
    pedir<InventarioDeAlmacenamiento>("/almacenamiento", { consulta: { sesion_id, ...consulta } }),

  /** No borra nada del navegador: devuelve la instruccion `removeItem`. */
  eliminar: (id: string) =>
    pedir<{
      entrada: unknown;
      eliminada_del_informe: boolean;
      eliminada_en_navegador: boolean;
      instruccion_cliente: string;
      mensaje: string;
    }>(`/almacenamiento/${id}`, { metodo: "DELETE" }),
};

// --------------------------------------------------------------------------
// Datos pasivos (exige consentimiento aceptado y vigente)
// --------------------------------------------------------------------------

export const datosPasivos = {
  capturar: (cuerpo: { sesion_id: string; categoria: string; clave: string; valor: string }) =>
    pedir<RespuestaCapturarDato>("/datos-pasivos", { metodo: "POST", cuerpo }),

  listar: (sesion_id: string, categoria?: string) =>
    pedir<InventarioDeDatosPasivos>("/datos-pasivos", { consulta: { sesion_id, categoria } }),

  eliminar: (id: string) =>
    pedir<{ dato: DatoPasivo; eliminado: boolean }>(`/datos-pasivos/${id}`, { metodo: "DELETE" }),
};

// --------------------------------------------------------------------------
// Permisos: dos pasos, porque cerrar el dialogo sin contestar tambien es un dato
// --------------------------------------------------------------------------

export const permisos = {
  /** Registra que el sitio *pidio* el permiso, antes de abrir el dialogo. */
  solicitar: (cuerpo: { sesion_id: string; juego_id?: string | null; tipo: TipoPermiso }) =>
    pedir<{ permiso: Permiso }>("/permisos", { metodo: "POST", cuerpo }),

  listar: (sesion_id: string, consulta: { estado?: EstadoPermiso; tipo?: TipoPermiso } = {}) =>
    pedir<InventarioDePermisos>("/permisos", { consulta: { sesion_id, ...consulta } }),

  obtener: (id: string) => pedir<{ permiso: Permiso }>(`/permisos/${id}`),

  /** Se responde una sola vez: el primer desenlace es el que vale. */
  responder: (id: string, cuerpo: { estado: RespuestaAlDialogo; ms_decision: number | null }) =>
    pedir<{ permiso: Permiso }>(`/permisos/${id}/respuesta`, { metodo: "PATCH", cuerpo }),

  /** Solo desde `concedido`. Corta el futuro y no reescribe el pasado. */
  revocar: (id: string) =>
    pedir<RespuestaRevocarPermiso>(`/permisos/${id}/revocacion`, { metodo: "POST" }),

  /** N lecturas bajo una sola concesion: eso es lo que demuestra el ejercicio. */
  registrarUbicacion: (id: string, cuerpo: PosicionAReportar) =>
    pedir<RespuestaLecturaUbicacion>(`/permisos/${id}/ubicacion`, { metodo: "POST", cuerpo }),

  /** Responde tambien para `denegado`: negar no es "el sitio no sabe donde estas". */
  alcance: (id: string, zona_horaria?: string) =>
    pedir<AlcanceDeUbicacion>(`/permisos/${id}/alcance`, { consulta: { zona_horaria } }),
};

// --------------------------------------------------------------------------
// Camara y microfono
// --------------------------------------------------------------------------

export const medios = {
  abrir: (cuerpo: {
    permiso_id: string;
    /** Lo que devolvio `getUserMedia`, no lo que se pidio. */
    pistas: PistaMedios[];
    dispositivo?: string | null;
    dispositivos_visibles?: number | null;
  }) => pedir<{ activacion: ActivacionDeMedios; indicador: IndicadorDeMedios }>("/medios", { metodo: "POST", cuerpo }),

  listar: (sesion_id: string, consulta: { permiso_id?: string; estado?: EstadoActivacion } = {}) =>
    pedir<InventarioDeMedios>("/medios", { consulta: { sesion_id, ...consulta } }),

  obtener: (id: string) =>
    pedir<{ activacion: ActivacionDeMedios; indicador: IndicadorDeMedios }>(`/medios/${id}`),

  /** `track.enabled = false`: corta los datos y **no** libera el dispositivo. */
  silenciar: (id: string, silenciada: boolean) =>
    pedir<{ activacion: ActivacionDeMedios; indicador: IndicadorDeMedios }>(`/medios/${id}/silencio`, {
      metodo: "PATCH",
      cuerpo: { silenciada },
    }),

  /** `track.stop()`: lo unico que apaga el indicador. */
  cerrar: (id: string) =>
    pedir<{ activacion: ActivacionDeMedios; indicador: IndicadorDeMedios }>(`/medios/${id}/cierre`, {
      metodo: "POST",
    }),

  /** "Lo note". Se admite con la captura ya cerrada, pero solo una vez. */
  avisar: (id: string, ms_hasta_notar: number | null) =>
    pedir<{ activacion: ActivacionDeMedios; indicador: IndicadorDeMedios }>(`/medios/${id}/aviso`, {
      metodo: "PATCH",
      cuerpo: { ms_hasta_notar },
    }),
};

// --------------------------------------------------------------------------
// Eventos del navegador (siempre en lote)
// --------------------------------------------------------------------------

export const eventos = {
  registrarLote: (cuerpo: { sesion_id: string; eventos: EventoAEnviar[] }) =>
    pedir<{ eventos: EventoDelNavegador[]; registrados: number }>("/eventos", { metodo: "POST", cuerpo }),

  listar: (sesion_id: string, consulta: { limite?: number; desplazamiento?: number; tipo_evento?: string } = {}) =>
    pedir<{ eventos: EventoDelNavegador[]; paginacion: Paginacion }>("/eventos", {
      consulta: { sesion_id, ...consulta },
    }),

  purgar: (sesion_id: string) =>
    pedir<{ eliminados: number }>("/eventos/purga", { metodo: "DELETE", consulta: { sesion_id, confirmar: true } }),
};

// --------------------------------------------------------------------------
// Partida y concientizacion
// --------------------------------------------------------------------------

export const resultados = {
  iniciar: (cuerpo: { sesion_id: string; juego_id: string; metricas?: Record<string, unknown> }) =>
    pedir<{ resultado: ResultadoDeJuego }>("/resultados", { metodo: "POST", cuerpo }),

  listar: (sesion_id: string) => pedir<InventarioDeResultados>("/resultados", { consulta: { sesion_id } }),

  obtener: (id: string) => pedir<{ resultado: ResultadoDeJuego }>(`/resultados/${id}`),

  progreso: (id: string, cuerpo: { puntaje?: number; metricas?: Record<string, unknown> }) =>
    pedir<{ resultado: ResultadoDeJuego }>(`/resultados/${id}`, { metodo: "PATCH", cuerpo }),

  /** Irreversible: un resultado completado ya no se reabre. */
  completar: (id: string, cuerpo: { puntaje?: number; metricas?: Record<string, unknown> } = {}) =>
    pedir<{ resultado: ResultadoDeJuego }>(`/resultados/${id}/completado`, { metodo: "POST", cuerpo }),
};

export const respuestas = {
  registrar: (cuerpo: {
    sesion_id: string;
    juego_id: string;
    riesgo_id: string;
    pregunta_codigo: string;
    respuesta: string;
    es_correcta: boolean;
  }) => pedir<{ respuesta: RespuestaDeConcientizacion }>("/respuestas", { metodo: "POST", cuerpo }),

  listar: (sesion_id: string, solo_incorrectas = false) =>
    pedir<InventarioDeRespuestas>("/respuestas", { consulta: { sesion_id, solo_incorrectas } }),
};

// --------------------------------------------------------------------------
// Mis datos: el inventario y el boton
// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// Billetera y cajero: la unica fuente de verdad del saldo
// --------------------------------------------------------------------------

export const billetera = {
  /** Saldo, resumen de caja, resumen de juego y si el retiro esta bloqueado. */
  estado: () => pedir<EstadoDeCaja>("/billetera"),

  movimientos: (consulta: { limite?: number; desplazamiento?: number; tipo?: TipoDeMovimiento } = {}) =>
    pedir<{ movimientos: MovimientoDeBilletera[]; paginacion: Paginacion }>(
      "/billetera/movimientos",
      { consulta },
    ),

  /**
   * Deposito. El banco es simulado —no hay pasarela detras— pero el saldo que
   * mueve es real y persistente.
   *
   * `clave_idempotencia` la genera el cliente y la repite al reintentar: es lo
   * que impide que un timeout de red acabe cobrando dos veces.
   */
  depositar: (cuerpo: {
    monto_centavos: number;
    metodo: string;
    sesion_id?: string;
    clave_idempotencia?: string;
  }) =>
    pedir<{
      billetera: Billetera;
      movimiento: MovimientoDeBilletera;
      bono: { promocion: Promocion; reclamo: ReclamoDePromocion; movimiento: MovimientoDeBilletera } | null;
      repetido: boolean;
    }>("/billetera/depositos", { metodo: "POST", cuerpo }),

  /** 422 si queda rollover pendiente de un bono activo. */
  retirar: (cuerpo: {
    monto_centavos: number;
    metodo: string;
    sesion_id?: string;
    clave_idempotencia?: string;
  }) =>
    pedir<{ billetera: Billetera; movimiento: MovimientoDeBilletera; repetido: boolean }>(
      "/billetera/retiros",
      { metodo: "POST", cuerpo },
    ),
};

// --------------------------------------------------------------------------
// Rondas: una fila por apuesta, resuelta en el servidor
// --------------------------------------------------------------------------

export const rondas = {
  /**
   * Abre una ronda: cobra la apuesta y devuelve el desenlace ya calculado.
   *
   * Salvo en blackjack, la ronda vuelve `resuelta`: el cliente ya no decide
   * nada, solo anima lo que el servidor determino. La respuesta trae la
   * billetera actualizada para no tener que volver a pedirla.
   */
  abrir: (cuerpo: {
    slug: SalaConApuesta;
    jugada: Record<string, unknown>;
    sesion_id?: string;
    semilla_cliente?: string;
  }) => pedir<RespuestaDeRonda>("/rondas", { metodo: "POST", cuerpo }),

  /** Solo blackjack: `pedir`, `plantarse` o `doblar` sobre una mano abierta. */
  accionar: (id: string, accion: AccionDeBlackjack) =>
    pedir<RespuestaDeRonda>(`/rondas/${id}/acciones`, { metodo: "POST", cuerpo: { accion } }),

  listar: (
    consulta: { limite?: number; desplazamiento?: number; sesion_id?: string; juego_id?: string } = {},
  ) =>
    pedir<{ rondas: RondaDeJuego[]; resumen: ResumenDeJuego; paginacion: Paginacion }>("/rondas", {
      consulta,
    }),

  obtener: (id: string) => pedir<{ ronda: RondaDeJuego }>(`/rondas/${id}`),
};

// --------------------------------------------------------------------------
// Promociones y torneos
// --------------------------------------------------------------------------

export const promociones = {
  /** Cada promocion llega con el reclamo de esta cuenta, si existe. */
  listar: () => pedir<{ promociones: Promocion[] }>("/promociones"),

  /**
   * Reclamar. El `mensaje` de la respuesta dice lo que **de verdad** paso: un
   * bono de deposito queda pendiente y no acredita nada hasta que se deposite.
   */
  reclamar: (id: string, sesion_id?: string) =>
    pedir<{
      promocion: Promocion;
      reclamo: ReclamoDePromocion;
      billetera: Billetera | null;
      movimiento: MovimientoDeBilletera | null;
      mensaje: string;
    }>(`/promociones/${id}/reclamo`, { metodo: "POST", cuerpo: { sesion_id } }),
};

export const torneos = {
  listar: () => pedir<{ torneos: Torneo[] }>("/torneos"),

  /** La clasificacion se calcula al vuelo desde los puntos de las rondas. */
  obtener: (id: string) => pedir<DetalleDeTorneo>(`/torneos/${id}`),

  inscribirse: (id: string) =>
    pedir<{ torneo: Torneo; inscripcion: InscripcionDeTorneo }>(`/torneos/${id}/inscripcion`, {
      metodo: "POST",
      cuerpo: {},
    }),
};

export const misDatos = {
  /** Consultar el inventario no se audita: revisar tu rastro no deja rastro. */
  inventario: (sesion_id: string) => pedir<InventarioDeMisDatos>("/mis-datos", { consulta: { sesion_id } }),

  /** Revoca lo que autoriza y borra lo recolectado. La respuesta es el recibo. */
  borrar: (sesion_id: string) =>
    pedir<ReciboDeBorrado>("/mis-datos", { metodo: "DELETE", consulta: { sesion_id, confirmar: true } }),
};

// --------------------------------------------------------------------------
// Consulta y evidencia (investigador / admin)
// --------------------------------------------------------------------------

export const huellas = {
  /** Investigador o admin. Se publica el prefijo del hash, nunca el hash. */
  listar: (consulta: { limite?: number; desplazamiento?: number; solo_recurrentes?: boolean } = {}) =>
    pedir<{ huellas: HuellaDelEstudio[]; paginacion: Paginacion }>("/huellas", { consulta }),

  obtener: (id: string) => pedir<{ huella: HuellaDelEstudio }>(`/huellas/${id}`),
};

export const auditoria = {
  /**
   * Solo admin y **solo lectura**: no existe POST, PATCH ni DELETE. Una bitácora
   * editable no sirve como evidencia.
   *
   * `sesion_id` es lo que vuelve reconstruible una visita completa.
   */
  listar: (
    consulta: {
      limite?: number;
      desplazamiento?: number;
      cuenta_actor_id?: string;
      accion?: string;
      entidad?: string;
      registro_id?: string;
      sesion_id?: string;
    } = {},
  ) => pedir<{ entradas: EntradaDeAuditoria[]; paginacion: Paginacion }>("/auditoria", { consulta }),
};

export const api = {
  auth,
  usuarios,
  huellas,
  auditoria,
  juegos,
  riesgos,
  sesiones,
  consentimientos,
  inferenciaPasiva,
  cookies,
  almacenamiento,
  datosPasivos,
  permisos,
  medios,
  eventos,
  resultados,
  respuestas,
  misDatos,
  billetera,
  rondas,
  promociones,
  torneos,
  salud,
};

export { ApiError } from "./client";
export type { CodigoDeError, DetalleDeError } from "./client";
export * from "./types";
