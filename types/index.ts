export interface Organizacion {
  id: number;
  nombre: string;
  dominio_google: string;
  activo: boolean;
}

export interface OrganizacionTema {
  id: number;
  organization_id: number;
  logo_url?: string | null;
  escudo_url?: string | null;
  color_primario: string;
  color_secundario: string;
  color_fondo_sidebar: string;
  color_hover_sidebar: string;
  color_fondo_topbar: string;
  color_boton_primario: string;
  color_boton_secundario: string;
  color_texto: string;
  tipografia: string;
  paleta_extendida_json?: string | null;
}

export interface Usuario {
  id: number;
  organization_id: number;
  google_id: string;
  email: string;
  nombre: string;
  rol_id: number;
  rol_nombre: string;
  dependencia_id?: number | null;
  activo: boolean;
  ultimo_login?: string | null;
  fecha_creacion: string;
}

export type Rol = 'Administrador' | 'Dependencia' | 'Consulta' | 'Gerencia';

export interface Dependencia {
  id: number;
  organization_id: number;
  nombre: string;
  descripcion?: string | null;
  responsable_id?: number | null;
  responsable_nombre?: string;
  activo: boolean;
}

export interface Vehiculo {
  id: number;
  organization_id: number;
  placa: string;
  tipo_vehiculo_id: number;
  tipo_vehiculo_nombre?: string;
  marca?: string | null;
  linea?: string | null;
  modelo?: number | null;
  color?: string | null;
  motor?: string | null;
  chasis?: string | null;
  vin?: string | null;
  capacidad?: string | null;
  combustible?: string | null;
  dependencia_id?: number | null;
  dependencia_nombre?: string;
  responsable_id?: number | null;
  responsable_nombre?: string;
  estado_id: number;
  estado_nombre?: string;
  ubicacion?: string | null;
  observaciones?: string | null;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  soat_estado?: string | null;
  tecno_estado?: string | null;
  poliza_estado?: string | null;
}

export type EstadoDocumento = 'Vigente' | 'Proximo_a_vencer' | 'Vencido' | 'Pendiente';

export interface Documento {
  id: number;
  organization_id: number;
  vehiculo_id: number;
  vehiculo_placa?: string;
  tipo_documento_id: number;
  tipo_documento_nombre?: string;
  fecha_expedicion?: string | null;
  fecha_vencimiento?: string | null;
  estado_documento: EstadoDocumento;
  archivo_url?: string | null;
  archivo_drive_id?: string | null;
  nombre_archivo?: string | null;
  tamano_bytes?: number | null;
  version: number;
  vigente_actual: boolean;
  observaciones?: string | null;
  fecha_carga: string;
}

export interface ConteoPorTipoDocumento {
  tipo_documento_id: number;
  tipo_documento_nombre: string;
  total: number;
  tamano_total_bytes: number;
}

export interface Alerta {
  id: number;
  organization_id: number;
  vehiculo_id: number;
  documento_id: number;
  tipo_alerta: string;
  canal: string;
  fecha_programada: string;
  fecha_envio?: string | null;
  destinatario: string;
  estado_envio: 'Pendiente' | 'Enviada' | 'Error';
  detalle_error?: string | null;
  leida: boolean;
  fecha_creacion: string;
}

export interface ConfigAlerta {
  id: number;
  organization_id: number;
  dias_antes: number;
  nivel: string;
  activo: boolean;
}

export interface VencimientoMensualTipo {
  mes: string;
  soat: number;
  tecnomecanica: number;
  poliza: number;
}

export interface HistorialCambio {
  id: number;
  organization_id: number;
  entidad: string;
  entidad_id: number;
  usuario_id?: number | null;
  usuario_nombre?: string;
  accion: string;
  campo_modificado?: string | null;
  valor_anterior?: string | null;
  valor_nuevo?: string | null;
  motivo?: string | null;
  fecha: string;
  referencia?: string | null;
}

export interface ConteoPorCampo {
  etiqueta: string;
  total: number;
}

export interface ResumenKPIs {
  total_vehiculos: number;
  vehiculos_activos: number;
  vehiculos_en_reposo: number;
  vehiculos_en_mantenimiento: number;
  vehiculos_en_comodato: number;
  vehiculos_dados_de_baja: number;
  soat_vigentes: number;
  soat_proximos_a_vencer: number;
  soat_vencidos: number;
  tecno_vigentes: number;
  tecno_proximos_a_vencer: number;
  tecno_vencidos: number;
  polizas_vigentes: number;
  polizas_proximas_a_vencer: number;
  polizas_vencidas: number;
  salud_documental_pct: number;
}

export interface DashboardCompleto {
  kpis: ResumenKPIs;
  por_dependencia: ConteoPorCampo[];
  por_tipo: ConteoPorCampo[];
  por_estado: ConteoPorCampo[];
  vencimientos_por_mes: ConteoPorCampo[];
  vencimientos_por_mes_tipo: VencimientoMensualTipo[];
}

export interface EstadoVehiculoCatalogo {
  id: number;
  nombre: string;
}

export interface TipoVehiculoCatalogo {
  id: number;
  nombre: string;
}

export interface TipoDocumentoCatalogo {
  id: number;
  nombre: string;
  obligatorio: boolean;
  dias_alerta_default: number;
}

export interface Catalogos {
  roles: { id: number; nombre: string; descripcion?: string | null }[];
  estados_vehiculo: EstadoVehiculoCatalogo[];
  tipos_vehiculo: TipoVehiculoCatalogo[];
  tipos_documento: TipoDocumentoCatalogo[];
}

export interface RespuestaAPI<T> {
  success: boolean;
  data: T;
  error?: string;
  meta?: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

// ── Listas configurables ──────────────────────────────────────────────────
export interface ListaConfiguracion {
  id: number;
  organization_id: number;
  tipo: string;
  nombre: string;
  activo: boolean;
  orden: number;
  fecha_creacion: string;
}

// ── Programación diaria 15-FR-36 ──────────────────────────────────────────
export interface ProgramacionItem {
  id?: number;
  programacion_id?: number;
  vehiculo_id?: number | null;
  vehiculo_placa?: string;
  conductor: string;
  dependencia: string;
  destino: string;
  hora_salida_punto: string;
  actividad: string;
  es_vacaciones: boolean;
  orden?: number;
}

export interface Programacion {
  id: number;
  organization_id: number;
  fecha: string;
  observaciones?: string | null;
  creado_por?: number | null;
  creado_por_nombre?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  items?: ProgramacionItem[];
}

export interface VehiculoFiltros {
  placa?: string;
  dependencia_id?: number;
  tipo_vehiculo_id?: number;
  estado_id?: number;
  marca?: string;
  page?: number;
  page_size?: number;
}

export interface DocumentoFiltros {
  tipo_documento_id?: number;
  estado_documento?: string;
  placa?: string;
  dependencia_id?: number;
  page?: number;
  page_size?: number;
}
