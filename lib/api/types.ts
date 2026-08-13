// lib/api/types.ts
/**
 * Tipos de la API del laboratorio.
 *
 * Son el espejo de los presenters del backend (`snake_case`, campos derivados
 * incluidos). Se declaran a mano y no se generan porque los derivados —
 * `decidio_sin_leer`, `concedido_sin_pensar`, `indicador_visible` — son la parte
 * didactica del contrato y conviene tenerlos a la vista.
 */

// --------------------------------------------------------------------------
// Vocabularios (los mismos enums que declara el dominio)
// --------------------------------------------------------------------------

export type Rol = "participante" | "investigador" | "admin";
export type RangoEdad = "18-24" | "25-34" | "35-44" | "45-54" | "55-64" | "65+";
export type EstadoParticipante = "activo" | "inactivo" | "anonimizado";
export type EstadoSesion = "activa" | "finalizada" | "abandonada";
export type TipoCookie = "sesion" | "persistente" | "tercero" | "analitica" | "publicidad";
export type SameSite = "Strict" | "Lax" | "None";

export type TipoPermiso =
  | "geolocalizacion"
  | "camara"
  | "microfono"
  | "notificaciones"
  | "portapapeles"
  | "bluetooth"
  | "midi"
  | "sensores";

export type EstadoPermiso = "solicitado" | "concedido" | "denegado" | "ignorado" | "revocado";
/** Los tres desenlaces del dialogo: ni `solicitado` ni `revocado` son respuesta. */
export type RespuestaAlDialogo = "concedido" | "denegado" | "ignorado";

export type CategoriaDatoPasivo =
  | "red"
  | "dispositivo"
  | "navegador"
  | "ubicacion"
  | "comportamiento"
  | "otro";

export type NivelRiesgo = "bajo" | "medio" | "alto" | "critico";
export type PistaMedios = "video" | "audio";
export type EstadoActivacion = "activa" | "silenciada" | "finalizada";
export type AreaAlmacenamiento = "local" | "sesion";
export type CategoriaAlmacenamiento =
  | "tecnico"
  | "preferencia"
  | "rastreo"
  | "credencial"
  | "personal"
  | "desconocido";
export type RiesgoAlmacenamiento = "ninguno" | "bajo" | "medio" | "alto";

export interface Paginacion {
  total: number;
  limite: number;
  desplazamiento: number;
}

// --------------------------------------------------------------------------
// Identidad
// --------------------------------------------------------------------------

export interface Participante {
  id: string;
  codigo_publico: string;
  alias: string;
  rango_edad: RangoEdad;
  estado: EstadoParticipante;
  creado_at: string;
  anonimizado_at: string | null;
}

export interface Cuenta {
  id: string;
  participante_id: string;
  rol: Rol;
  activa: boolean;
  ultimo_acceso_at: string | null;
  creado_at: string;
}

/**
 * Fila del padrón: participante + su cuenta, tal como la devuelve el listado.
 * No es una entidad, pero pasa igual por un presenter para no publicar camelCase.
 */
export interface UsuarioDelPadron {
  participante_id: string;
  codigo_publico: string;
  alias: string;
  rango_edad: RangoEdad;
  estado: EstadoParticipante;
  creado_at: string;
  anonimizado_at: string | null;
  cuenta: {
    id: string;
    rol: Rol;
    activa: boolean;
    ultimo_acceso_at: string | null;
    creado_at: string;
  } | null;
}

/** Huella de dispositivo. Nunca sale el hash completo, solo su prefijo. */
export interface HuellaDelEstudio {
  id: string;
  hash_huella_prefijo: string;
  resolucion: string;
  zona_horaria: string;
  visitas: number;
  es_recurrente: boolean;
  creado_at: string;
  actualizado_at: string;
}

/** Entrada de la bitácora. Solo lectura desde la API, a propósito. */
export interface EntradaDeAuditoria {
  id: string;
  cuenta_actor_id: string | null;
  accion: string;
  entidad: string;
  registro_id: string | null;
  /** Lo que vuelve reconstruible una visita completa. */
  sesion_id: string | null;
  datos_antes: Record<string, unknown> | null;
  datos_despues: Record<string, unknown> | null;
  ocurrido_at: string;
}

export interface PoliticaDeContrasena {
  contrasena: {
    largo_minimo: number;
    largo_maximo: number;
    descripcion: string;
  };
}

export interface RespuestaDeRegistro {
  participante: Participante;
  cuenta: Cuenta;
}

export interface RespuestaDeLogin {
  token: string;
  expira_en: number;
  expira_at: string;
  cuenta: Cuenta;
  participante: Participante;
}

export interface Identidad {
  participante: Participante;
  cuenta: Cuenta;
}

// --------------------------------------------------------------------------
// Catalogos
// --------------------------------------------------------------------------

export interface Juego {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  tecnologia_demo: string;
  instrucciones_seguridad: string;
  activo: boolean;
  orden: number;
  creado_at: string;
}

export interface Riesgo {
  id: string;
  codigo: string;
  categoria: string;
  nivel: NivelRiesgo;
  titulo: string;
  descripcion: string;
  recomendacion: string;
  es_grave: boolean;
  activo: boolean;
  creado_at: string;
}

// --------------------------------------------------------------------------
// Sesion de laboratorio
// --------------------------------------------------------------------------

export interface Sesion {
  id: string;
  participante_id: string;
  cuenta_id: string;
  huella_id: string | null;
  estado: EstadoSesion;
  version_laboratorio: string;
  user_agent: string | null;
  iniciada_at: string;
  finalizada_at: string | null;
}

export interface HuellaDeSesion {
  hash_huella_prefijo: string;
  visitas: number;
  es_recurrente: boolean;
}

export interface SenalesDeHuella {
  canvas_hash: string;
  gpu_webgl: string;
  resolucion: string;
  zona_horaria: string;
}

export interface RespuestaAbrirSesion {
  sesion: Sesion;
  huella: HuellaDeSesion;
  /** El dato didactico: te reconocio el dispositivo aunque no hubiera cookies. */
  reconocido_sin_cookies: boolean;
}

// --------------------------------------------------------------------------
// Consentimiento
// --------------------------------------------------------------------------

export interface Consentimiento {
  id: string;
  sesion_id: string;
  version_aviso: string;
  aceptado: boolean;
  alcance: Record<string, unknown>;
  ms_decision: number | null;
  esta_vigente: boolean;
  /** Decidio en menos de 2 000 ms. */
  decidio_sin_leer: boolean;
  respondido_at: string;
  revocado_at: string | null;
}

// --------------------------------------------------------------------------
// Inferencia pasiva
// --------------------------------------------------------------------------

export interface SenalPasiva {
  clave: string;
  categoria: CategoriaDatoPasivo;
  fuente: string;
  valor: string;
  requiere_permiso: boolean;
  revela: string;
  entropia_bits: number;
}

export interface InferenciaPasiva {
  navegador: string;
  motor: string;
  sistema_operativo: { nombre: string; version: string | null };
  dispositivo: { tipo: string; es_movil: boolean; pantalla_touch: boolean | null };
  es_bot: boolean;
  idiomas: { preferido: string | null; lista: string[]; region_probable: string | null };
  zona_horaria: {
    nombre: string | null;
    area: string | null;
    ciudad: string | null;
    desfase_utc_minutos: number | null;
    region_probable: string | null;
  };
  pantalla: {
    resolucion: string | null;
    ancho: number | null;
    alto: number | null;
    orientacion: string | null;
    profundidad_color: number | null;
  };
  red: { ip_hash_prefijo: string; familia: string; via_proxy: boolean } | null;
  preferencia_de_no_rastreo: boolean | null;
  region: {
    por_idioma: string | null;
    por_zona_horaria: string | null;
    estado: string;
    lectura: string;
  };
  notas: string[];
}

export interface InformeDeInferencia {
  senales: SenalPasiva[];
  inferencia: InferenciaPasiva;
  resumen: {
    total: number;
    sin_permiso: number;
    por_fuente: Record<string, number>;
    por_categoria: Record<string, number>;
    entropia_bits: number;
    uno_en_aproximado: number;
    nota_entropia: string;
  };
  aviso: string;
}

export interface SenalesDelCliente {
  resolucion?: string;
  zona_horaria?: string;
  desfase_utc_minutos?: number | null;
  plataforma?: string;
  nucleos_cpu?: number;
  memoria_gb?: number;
  profundidad_color?: number;
  pantalla_touch?: boolean;
}

// --------------------------------------------------------------------------
// Cookies
// --------------------------------------------------------------------------

export interface CookieDelLaboratorio {
  id: string;
  sesion_id: string;
  juego_id: string | null;
  nombre: string;
  tipo: TipoCookie;
  proposito: string;
  /** El valor nunca vuelve: solo su HMAC. */
  valor_hash: string;
  secure_flag: boolean;
  http_only_flag: boolean;
  same_site: SameSite;
  es_de_sesion: boolean;
  creada_at: string;
  expira_at: string | null;
  eliminada_at: string | null;
}

export interface RespuestaGuardarCookie {
  cookie: CookieDelLaboratorio;
  emitida_en_navegador: boolean;
  reemplazo: boolean;
  advertencias: string[];
}

export interface InventarioDeCookies {
  cookies: CookieDelLaboratorio[];
  resumen: {
    total: number;
    vigentes: number;
    eliminadas: number;
    por_tipo: Record<string, number>;
  };
}

// --------------------------------------------------------------------------
// Almacenamiento del navegador
// --------------------------------------------------------------------------

export interface EntradaDeAlmacenamiento {
  id: string;
  sesion_id: string;
  juego_id: string | null;
  area: AreaAlmacenamiento;
  clave: string;
  valor_hash: string;
  tamano_bytes: number;
  categoria: CategoriaAlmacenamiento;
  riesgo: RiesgoAlmacenamiento;
  proposito: string;
  es_tecnica: boolean;
  es_persistente: boolean;
  preocupa: boolean;
  cambios: number;
  detectada_at: string;
  actualizada_at: string;
  eliminada_at: string | null;
}

export interface ResumenDeAlmacenamiento {
  total: number;
  vivas: number;
  eliminadas: number;
  tecnicas: number;
  sin_valor_para_ti: number;
  por_area: Record<string, number>;
  por_categoria: Record<string, number>;
  por_riesgo: Record<string, number>;
  persistentes: number;
  bytes_totales: number;
  reescrituras: number;
  riesgo_maximo: RiesgoAlmacenamiento;
  parcial?: boolean;
}

export interface EntradaASincronizar {
  area: AreaAlmacenamiento;
  clave: string;
  valor: string;
  tamano_bytes?: number;
}

export interface RespuestaSincronizarAlmacenamiento {
  cambio: {
    nuevas: EntradaDeAlmacenamiento[];
    cambiadas: EntradaDeAlmacenamiento[];
    sin_cambio: number;
    desaparecidas: EntradaDeAlmacenamiento[];
  };
  inventario: EntradaDeAlmacenamiento[];
  resumen: ResumenDeAlmacenamiento;
  auto_declarado: true;
}

export interface InventarioDeAlmacenamiento {
  entradas: EntradaDeAlmacenamiento[];
  resumen: ResumenDeAlmacenamiento;
  auto_declarado: true;
}

// --------------------------------------------------------------------------
// Datos pasivos
// --------------------------------------------------------------------------

export interface DatoPasivo {
  id: string;
  sesion_id: string;
  categoria: CategoriaDatoPasivo;
  clave: string;
  valor: string;
  es_sensible: boolean;
  capturado_at: string;
}

export interface RespuestaCapturarDato {
  dato: DatoPasivo;
  creado: boolean;
  valor_hasheado: boolean;
}

export interface InventarioDeDatosPasivos {
  datos: DatoPasivo[];
  resumen: { total: number; sensibles: number; por_categoria: Record<string, number> };
}

// --------------------------------------------------------------------------
// Permisos
// --------------------------------------------------------------------------

export interface Permiso {
  id: string;
  sesion_id: string;
  juego_id: string | null;
  tipo: TipoPermiso;
  estado: EstadoPermiso;
  ms_decision: number | null;
  fue_respondido: boolean;
  /** La llave sigue puesta. */
  sigue_vigente: boolean;
  fue_revocado: boolean;
  /** Concedido en menos de 2 000 ms. */
  concedido_sin_pensar: boolean;
  solicitado_at: string;
  respondido_at: string | null;
  revocado_at: string | null;
}

export interface ResumenDePermisos {
  total: number;
  /** Los que llego a conceder, revocados incluidos. */
  concedidos: number;
  vigentes: number;
  revocados: number;
  denegados: number;
  ignorados: number;
  sin_responder: number;
  concedidos_sin_pensar: number;
}

export interface InventarioDePermisos {
  permisos: Permiso[];
  resumen: ResumenDePermisos;
}

export interface LecturaDeUbicacion {
  id: string;
  permiso_id: string;
  sesion_id: string;
  ubicacion_hash_prefijo: string;
  latitud_aprox: number;
  longitud_aprox: number;
  precision_m: number;
  altitud_m: number | null;
  velocidad_ms: number | null;
  desplazamiento: string | null;
  leida_at: string;
}

export interface AlcanceDeUbicacion {
  decision: {
    estado: EstadoPermiso;
    fue_respondido: boolean;
    ms_decision: number | null;
    concedido_sin_pensar: boolean;
    lectura: string;
  };
  con_permiso: {
    obtenido: boolean;
    lecturas: number;
    mejor_precision_m: number | null;
    nivel: string;
    campos_obtenidos: string[];
    repitio_lugar: boolean;
    /** Concedido una vez, leible siempre. */
    puede_repetirse: boolean;
    desplazamiento: string | null;
    lectura: string;
  };
  sin_permiso: {
    nivel: string;
    precision_aproximada_m: number | null;
    senales: Array<{
      senal: string;
      precision_aproximada_m: number | null;
      calculada_aqui: boolean;
      lectura: string;
    }>;
    lectura: string;
  };
  comparacion: {
    veces_mas_preciso: number | null;
    con_permiso_m: number | null;
    sin_permiso_m: number | null;
    lectura: string;
  };
}

export interface PosicionAReportar {
  latitud: number;
  longitud: number;
  precision_m: number;
  altitud_m?: number | null;
  velocidad_ms?: number | null;
  zona_horaria?: string;
}

export interface RespuestaLecturaUbicacion {
  lectura: LecturaDeUbicacion;
  lecturas: number;
  repitio_lugar: boolean;
  alcance: AlcanceDeUbicacion;
  lo_que_se_guarda: {
    coordenadas_exactas: boolean;
    celda_aproximada_m: number;
    hash_de_posicion: boolean;
    lectura: string;
  };
}

export interface RespuestaRevocarPermiso {
  permiso: Permiso;
  lecturas_conservadas: number;
  activacion_cerrada: boolean;
  mensaje: string;
}

// --------------------------------------------------------------------------
// Camara y microfono
// --------------------------------------------------------------------------

export interface ActivacionDeMedios {
  id: string;
  permiso_id: string;
  sesion_id: string;
  pistas: PistaMedios[];
  estado: EstadoActivacion;
  /** Derivado: la pagina no puede apagar el indicador del navegador. */
  indicador_visible: boolean;
  dispositivo_hash_prefijo: string | null;
  dispositivos_visibles: number | null;
  notada: boolean;
  ms_hasta_notar: number | null;
  paso_desapercibida: boolean;
  siguio_abierta_tras_silenciar: boolean;
  pistas_extra: PistaMedios[];
  duracion_ms: number;
  iniciada_at: string;
  silenciada_at: string | null;
  finalizada_at: string | null;
}

export interface IndicadorDeMedios {
  indicador_visible: boolean;
  duracion_ms: number;
  lectura: string;
  donde_mirar: string;
  notas: string[];
}

export interface InventarioDeMedios {
  activaciones: ActivacionDeMedios[];
  indicadores: IndicadorDeMedios[];
  resumen: {
    total: number;
    activas: number;
    silenciadas: number;
    finalizadas: number;
    abiertas_ahora: number;
    ms_con_acceso_total: number;
    pasaron_desapercibidas: number;
    siguieron_abiertas_tras_silenciar: number;
    ms_hasta_notar_promedio: number | null;
    por_pista: Record<string, number>;
    lectura: string;
    donde_mirar: string;
  };
}

// --------------------------------------------------------------------------
// Eventos
// --------------------------------------------------------------------------

export interface EventoDelNavegador {
  id: string;
  sesion_id: string;
  juego_id: string | null;
  tipo_evento: string;
  detalle: Record<string, unknown>;
  ocurrido_at: string;
}

export interface EventoAEnviar {
  juego_id?: string | null;
  tipo_evento: string;
  detalle: Record<string, unknown>;
  ocurrido_at?: string;
}

// --------------------------------------------------------------------------
// Partida y concientizacion
// --------------------------------------------------------------------------

export interface ResultadoDeJuego {
  id: string;
  sesion_id: string;
  juego_id: string;
  puntaje: number;
  completado: boolean;
  metricas: Record<string, unknown>;
  iniciado_at: string;
  completado_at: string | null;
}

export interface InventarioDeResultados {
  resultados: ResultadoDeJuego[];
  resumen: { total: number; completados: number; en_curso: number; puntaje_total: number };
}

export interface RespuestaDeConcientizacion {
  id: string;
  sesion_id: string;
  juego_id: string;
  riesgo_id: string;
  pregunta_codigo: string;
  respuesta: string;
  es_correcta: boolean;
  respondido_at: string;
}

export interface InventarioDeRespuestas {
  respuestas: RespuestaDeConcientizacion[];
  resumen: {
    total: number;
    correctas: number;
    incorrectas: number;
    aciertos_porcentaje: number;
    parcial: boolean;
  };
}

// --------------------------------------------------------------------------
// Mis datos
// --------------------------------------------------------------------------

export interface ConteoPorRecurso {
  cookies: number;
  almacenamiento: number;
  datos_pasivos: number;
  lecturas_ubicacion: number;
  activaciones_medios: number;
  eventos: number;
  resultados: number;
  respuestas: number;
  total: number;
}

export interface RecursoConservado {
  recurso: string;
  motivo: string;
}

export interface InventarioDeMisDatos {
  sesion: Sesion;
  se_borra: ConteoPorRecurso;
  se_revoca: { consentimiento: boolean; permisos: number };
  /** No es relleno legal: es la leccion. */
  no_se_va: RecursoConservado[];
}

export interface ReciboDeBorrado {
  sesion: Sesion;
  borrado: ConteoPorRecurso;
  revocado: { consentimiento: boolean; permisos: number; tipos: TipoPermiso[] };
  no_se_va: RecursoConservado[];
  lectura: string;
}

// --------------------------------------------------------------------------
// Economia del casino
// --------------------------------------------------------------------------

/**
 * El dinero viaja en **centavos enteros** y, por comodidad, tambien en pesos.
 *
 * La cifra autoritativa es siempre `*_centavos`: es la que se manda de vuelta al
 * apostar o depositar. Los `*_mxn` existen solo para pintar. Operar con los
 * pesos y volver a multiplicar por 100 reintroduciria exactamente los errores de
 * coma flotante que el backend evita guardando enteros.
 */
export interface Billetera {
  id: string;
  saldo_centavos: number;
  saldo_mxn: number;
  moneda: "MXN";
  bloqueada: boolean;
  actualizado_at: string;
}

export type TipoDeMovimiento =
  | "deposito"
  | "retiro"
  | "apuesta"
  | "premio"
  | "devolucion"
  | "bono"
  | "ajuste";

export interface MovimientoDeBilletera {
  id: string;
  /**
   * Orden de insercion, y la unica forma correcta de recorrer la cadena de
   * saldos. Ordenar por `creado_at` no sirve: los movimientos de una misma
   * transaccion (la apuesta y su premio) comparten la marca al microsegundo,
   * porque `now()` en PostgreSQL devuelve la hora de inicio de la transaccion.
   */
  secuencia: number;
  tipo: TipoDeMovimiento;
  monto_centavos: number;
  monto_mxn: number;
  saldo_posterior_centavos: number;
  saldo_posterior_mxn: number;
  concepto: string;
  sesion_id: string | null;
  juego_id: string | null;
  ronda_id: string | null;
  metadatos: Record<string, unknown>;
  creado_at: string;
}

export interface ResumenDeJuego {
  rondas: number;
  ganadas: number;
  apostado_centavos: number;
  apostado_mxn: number;
  retornado_centavos: number;
  retornado_mxn: number;
  neto_centavos: number;
  neto_mxn: number;
  mayor_premio_centavos: number;
  mayor_premio_mxn: number;
}

/** Lo que impide retirar ahora mismo, con su motivo en texto. */
export interface EstadoDeRetiro {
  bloqueado: boolean;
  rollover_pendiente_centavos: number;
  rollover_pendiente_mxn: number;
  motivo: string | null;
}

export interface EstadoDeCaja {
  billetera: Billetera;
  caja: Record<string, { operaciones: number; total_centavos: number; total_mxn: number }>;
  juego: ResumenDeJuego;
  retiro: EstadoDeRetiro;
}

export type EstadoDeRonda = "abierta" | "resuelta" | "anulada";

/** Slugs de las salas que aceptan saldo real. */
export type SalaConApuesta =
  | "ruleta"
  | "tragamonedas"
  | "rasca-y-gana"
  | "mesa-en-vivo"
  | "blackjack-vip";

export type TipoApuestaRuleta =
  | "numero" | "rojo" | "negro" | "par" | "impar"
  | "bajo" | "alto" | "docena" | "columna";

export interface ApuestaDeRuleta {
  tipo: TipoApuestaRuleta;
  valor?: number | null;
  monto_centavos: number;
}

export interface CartaDeBlackjack {
  palo: "picas" | "corazones" | "diamantes" | "treboles";
  rango: string;
  valor: number;
}

/**
 * El desenlace es distinto en cada sala, asi que se tipa como union laxa: el
 * componente de cada juego sabe cual le toca y lo estrecha al leerlo.
 */
export type DesenlaceDeRonda = Record<string, unknown>;

/**
 * El comprobante de juego justo.
 *
 * `semilla_servidor` llega en `null` mientras la ronda sigue abierta: revelarla
 * antes permitiria calcular el resultado y decidir la jugada sabiendolo.
 */
export interface ComprobanteDeEquidad {
  semilla_servidor_hash: string;
  semilla_cliente: string;
  nonce: number;
  semilla_servidor: string | null;
  como_verificar: string;
}

export interface RondaDeJuego {
  id: string;
  sesion_id: string | null;
  juego_id: string;
  estado: EstadoDeRonda;
  apuesta_centavos: number;
  apuesta_mxn: number;
  premio_centavos: number;
  premio_mxn: number;
  neto_centavos: number;
  neto_mxn: number;
  jugada: Record<string, unknown>;
  desenlace: DesenlaceDeRonda | null;
  equidad: ComprobanteDeEquidad;
  creado_at: string;
  resuelta_at: string | null;
}

export interface RespuestaDeRonda {
  ronda: RondaDeJuego;
  billetera: Billetera;
}

export type AccionDeBlackjack = "pedir" | "plantarse" | "doblar";

export type TipoDePromocion = "bono_saldo" | "bono_deposito" | "cashback" | "torneo";

export type EstadoDeReclamo = "pendiente" | "activo" | "cumplido" | "expirado";

export interface ReclamoDePromocion {
  id: string;
  promocion_id: string;
  estado: EstadoDeReclamo;
  monto_bono_centavos: number;
  monto_bono_mxn: number;
  rollover_requerido_centavos: number;
  rollover_cumplido_centavos: number;
  rollover_pendiente_centavos: number;
  rollover_pendiente_mxn: number;
  bloquea_retiro: boolean;
  reclamado_at: string;
  acreditado_at: string | null;
  cumplido_at: string | null;
}

interface ImporteDual {
  centavos: number;
  mxn: number;
}

export interface Promocion {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  tipo: TipoDePromocion;
  etiqueta: string;
  terminos: string;
  porcentaje: number | null;
  monto_maximo: ImporteDual;
  deposito_minimo: ImporteDual;
  monto_fijo: ImporteDual;
  rollover_multiplicador: number;
  vigencia_texto: string;
  vigente_hasta: string | null;
  orden: number;
  vigente: boolean;
  reclamo: ReclamoDePromocion | null;
}

export type EstadoDeTorneo = "proximo" | "activo" | "finalizado";

export interface InscripcionDeTorneo {
  id: string;
  torneo_id: string;
  puntos: number;
  apostado_centavos: number;
  apostado_mxn: number;
  premio_centavos: number;
  inscrito_at: string;
}

export interface Torneo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  juego_id: string | null;
  estado: EstadoDeTorneo;
  bolsa_centavos: number;
  bolsa_mxn: number;
  centavos_por_punto: number;
  mxn_por_punto: number;
  plazas_premiadas: number;
  inicia_at: string;
  termina_at: string;
  juego: Juego | null;
  inscripcion: InscripcionDeTorneo | null;
}

/** Una fila de la tabla: alias y codigo publico, nunca el id de cuenta. */
export interface FilaDeClasificacion {
  posicion: number;
  alias: string;
  codigo_publico: string;
  puntos: number;
  apostado_centavos: number;
  apostado_mxn: number;
  premio_estimado_centavos: number;
  premio_estimado_mxn: number;
}

export interface DetalleDeTorneo {
  torneo: Torneo;
  juego: Juego | null;
  clasificacion: FilaDeClasificacion[];
  inscripcion: InscripcionDeTorneo | null;
  mi_posicion: {
    posicion: number;
    puntos: number;
    apostado_centavos: number;
    premio_estimado_centavos: number;
  } | null;
  reparto_de_bolsa: Array<{ posicion: number; premio_centavos: number }>;
}
