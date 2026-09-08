import { api } from './api-client';
import type {
  Alerta,
  Catalogos,
  ConfigAlerta,
  DashboardCompleto,
  Dependencia,
  Documento,
  DocumentoFiltros,
  ConteoPorTipoDocumento,
  HistorialCambio,
  ListaConfiguracion,
  Organizacion,
  OrganizacionTema,
  Programacion,
  Usuario,
  Vehiculo,
  VehiculoFiltros,
} from '@/types';

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const vehiculosService = {
  listar: (filtros: VehiculoFiltros = {}) => api.getWithMeta<Vehiculo[]>(`/vehiculos${buildQuery(filtros as Record<string, unknown>)}`),
  obtener: (id: number) => api.get<Vehiculo>(`/vehiculos/${id}`),
  crear: (data: Partial<Vehiculo>) => api.post<{ id: number }>('/vehiculos', data),
  actualizar: (id: number, data: Partial<Vehiculo> & { motivo?: string }) => api.put(`/vehiculos/${id}`, data),
  eliminar: (id: number) => api.delete(`/vehiculos/${id}`),
  historial: (id: number) => api.get<HistorialCambio[]>(`/vehiculos/${id}/historial`),
};

export const documentosService = {
  listarPorVehiculo: (vehiculoId: number) => api.get<Documento[]>(`/vehiculos/${vehiculoId}/documentos`),
  historico: (vehiculoId: number, tipoDocumentoId: number) =>
    api.get<Documento[]>(`/vehiculos/${vehiculoId}/documentos/${tipoDocumentoId}/historico`),
  subir: (vehiculoId: number, form: FormData) =>
    api.postForm<{ id: number; archivo_url: string }>(`/vehiculos/${vehiculoId}/documentos/upload`, form),
  notificar: (vehiculoId: number, data: { tipo_documento?: string; fecha_vencimiento?: string; destinatario_extra?: string }) =>
    api.post<{ enviado: boolean }>(`/vehiculos/${vehiculoId}/documentos/notificar`, data),
  listarGlobal: (filtros: DocumentoFiltros = {}) => api.getWithMeta<Documento[]>(`/documentos${buildQuery(filtros as Record<string, unknown>)}`),
  conteoPorTipo: () => api.get<ConteoPorTipoDocumento[]>('/documentos/conteo-por-tipo'),
};

export const dashboardService = {
  obtenerResumen: () => api.get<DashboardCompleto>('/dashboard'),
};

export const alertasService = {
  listar: (soloPendientes = false) => api.get<Alerta[]>(`/alertas${soloPendientes ? '?pendientes=true' : ''}`),
  ejecutarRevisionManual: () => api.post('/alertas/ejecutar-revision'),
  marcarLeida: (id: number) => api.put(`/alertas/${id}/leida`),
  marcarTodasLeidas: () => api.put('/alertas/marcar-todas-leidas'),
  listarConfig: () => api.get<ConfigAlerta[]>('/alertas/config'),
  crearConfig: (data: { dias_antes: number; nivel: string }) => api.post<{ id: number }>('/alertas/config', data),
  actualizarConfig: (id: number, data: { dias_antes: number; nivel: string; activo: boolean }) =>
    api.put(`/alertas/config/${id}`, data),
  eliminarConfig: (id: number) => api.delete(`/alertas/config/${id}`),
};

export const historialService = {
  reciente: (limite = 10) => api.get<HistorialCambio[]>(`/historial/reciente?limite=${limite}`),
};

export const catalogosService = {
  obtenerTodos: () => api.get<Catalogos>('/catalogos'),
};

export const dependenciasService = {
  listar: () => api.get<Dependencia[]>('/dependencias'),
  crear: (data: Partial<Dependencia>) => api.post<{ id: number }>('/dependencias', data),
  actualizar: (id: number, data: Partial<Dependencia>) => api.put(`/dependencias/${id}`, data),
  eliminar: (id: number) => api.delete(`/dependencias/${id}`),
};

export const usuariosService = {
  listar: () => api.get<Usuario[]>('/usuarios'),
  invitar: (data: { email: string; nombre: string; rol_id: number; dependencia_id?: number | null }) =>
    api.post<{ id: number }>('/usuarios', data),
  actualizarRol: (id: number, rolId: number, dependenciaId: number | null) =>
    api.put(`/usuarios/${id}/rol`, { rol_id: rolId, dependencia_id: dependenciaId }),
  actualizarActivo: (id: number, activo: boolean) => api.put(`/usuarios/${id}/activo`, { activo }),
};

export const authService = {
  loginConGoogle: (idToken: string) => api.post<{ token: string; usuario: Usuario }>('/auth/google', { id_token: idToken }),
  loginConCredenciales: (email: string, password: string) =>
    api.post<{ token: string; usuario: Usuario }>('/auth/local', { email, password }),
};

export const temaService = {
  // Sin autenticación: se usa en la pantalla de login para tematizar antes de que el usuario inicie sesión.
  obtenerPorDominio: (dominio: string) => api.get<OrganizacionTema>(`/public/tema?dominio=${encodeURIComponent(dominio)}`),
  // Con sesión: refresca el branding ya autenticado.
  obtenerPropio: () => api.get<OrganizacionTema>('/tema'),
};

export const organizacionService = {
  obtenerPropia: () => api.get<Organizacion>('/organizacion'),
};

export const listasService = {
  listar: (tipo?: string) => api.get<ListaConfiguracion[]>(`/listas${tipo ? `?tipo=${encodeURIComponent(tipo)}` : ''}`),
  crear: (data: { tipo: string; nombre: string; orden?: number }) => api.post<{ id: number }>('/listas', data),
  actualizar: (id: number, data: { nombre: string; orden: number; activo: boolean }) => api.put(`/listas/${id}`, data),
  eliminar: (id: number) => api.delete(`/listas/${id}`),
};

export const programacionesService = {
  listar: () => api.get<Programacion[]>('/programaciones'),
  obtener: (id: number) => api.get<Programacion>(`/programaciones/${id}`),
  crear: (data: Partial<Programacion>) => api.post<{ id: number }>('/programaciones', data),
  actualizar: (id: number, data: Partial<Programacion>) => api.put(`/programaciones/${id}`, data),
  eliminar: (id: number) => api.delete(`/programaciones/${id}`),
};
