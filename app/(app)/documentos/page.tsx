'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box, Paper, Typography, TextField, IconButton, Grid,
  CircularProgress, Alert, Stack, Chip, Table, TableHead,
  TableBody, TableRow, TableCell, TablePagination, Tooltip,
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTheme, alpha } from '@mui/material/styles';
import AppShell from '@/components/layout/app-shell';
import StatusBadge from '@/components/ui/status-badge';
import { documentosService } from '@/lib/services';
import { ApiError } from '@/lib/api-client';
import type { Documento, ConteoPorTipoDocumento } from '@/types';

// ── Configuración visual por tipo de documento ─────────────────────────────

const CONFIG_TIPO: Record<string, {
  gradiente: string;
  icono: () => JSX.Element;
}> = {
  'SOAT': {
    gradiente: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    icono: () => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3C8.48 3 4 7.48 4 13s4.48 10 10 10 10-4.48 10-10S19.52 3 14 3z" fill="rgba(255,255,255,0.15)" />
        <path d="M9 13.5l3.5 3.5 6.5-7" strokeWidth="2.2" />
        <path d="M14 7v2M14 19v2M7 14H5M23 14h-2" strokeWidth="1.4" />
      </svg>
    ),
  },
  'Tecnomecánica': {
    gradiente: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    icono: () => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 4a4.5 4.5 0 0 1 .9 5.2L24 14.8a1.5 1.5 0 0 1 0 2.1l-2.1 2.1a1.5 1.5 0 0 1-2.1 0L14.1 13.4A4.5 4.5 0 0 1 9 12.5a4.5 4.5 0 0 1 0-6.5L12 9l1.5-1.5-3-4z" />
        <circle cx="8" cy="20" r="2" fill="white" stroke="none" />
        <path d="M5 23l4-4" strokeWidth="1.5" />
      </svg>
    ),
  },
  'Póliza de seguros': {
    gradiente: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    icono: () => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3L5 7v7c0 5 4.6 9.6 9 11 4.4-1.4 9-6 9-11V7L14 3z" fill="rgba(255,255,255,0.15)" />
        <path d="M10 14l2.5 2.5 5.5-6" strokeWidth="2" />
      </svg>
    ),
  },
  'Tarjeta de propiedad': {
    gradiente: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    icono: () => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="22" height="16" rx="3" fill="rgba(255,255,255,0.15)" />
        <path d="M3 11h22" />
        <path d="M7 16h6M7 19h4" strokeWidth="2" />
        <rect x="18" y="14" width="4" height="4" rx="1" fill="rgba(255,255,255,0.6)" stroke="none" />
      </svg>
    ),
  },
  'Licencia de tránsito': {
    gradiente: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
    icono: () => (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="5" width="20" height="18" rx="3" fill="rgba(255,255,255,0.15)" />
        <circle cx="10" cy="13" r="3" fill="rgba(255,255,255,0.5)" stroke="none" />
        <path d="M15 11h5M15 14h4M15 17h3" strokeWidth="1.6" />
      </svg>
    ),
  },
};

const CONFIG_DEFAULT = {
  gradiente: 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
  icono: () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h10l6 6v16H5V3z" fill="rgba(255,255,255,0.15)" />
      <path d="M17 3v6h6" />
      <path d="M9 13h10M9 17h7" />
    </svg>
  ),
};

// Estado documental: colores y etiquetas
const ESTADO_ESTILO: Record<string, { dot: string; label: string }> = {
  Vigente:           { dot: '#16A34A', label: 'Vigente' },
  Proximo_a_vencer:  { dot: '#D97706', label: 'Por vencer' },
  Vencido:           { dot: '#DA151C', label: 'Vencido' },
  Pendiente:         { dot: '#94A3B8', label: 'Pendiente' },
};

function formatearTamano(bytes: number) {
  if (!bytes || bytes === 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

function DocumentosContent() {
  const theme = useTheme();
  const searchParams = useSearchParams();
  const [carpetas, setCarpetas] = useState<ConteoPorTipoDocumento[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  // Leer parámetros URL del dashboard (tipo_documento_id, estado_documento)
  const tipoIdUrl = searchParams.get('tipo_documento_id');
  const estadoDocUrl = searchParams.get('estado_documento');
  const [tipoSeleccionado, setTipoSeleccionado] = useState<number | null>(tipoIdUrl ? Number(tipoIdUrl) : null);
  const [estadoFiltro, setEstadoFiltro] = useState<string | undefined>(estadoDocUrl || undefined);
  const [busqueda, setBusqueda] = useState('');
  const [vista, setVista] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(24);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    documentosService.conteoPorTipo().then((res) => setCarpetas(res || [])).catch(() => setCarpetas([]));
  }, []);

  const cargarDocumentos = useCallback(() => {
    setCargando(true); setError(null);
    documentosService.listarGlobal({
      tipo_documento_id: tipoSeleccionado || undefined,
      estado_documento: estadoFiltro || undefined,
      placa: busqueda || undefined,
      page: page + 1,
      page_size: pageSize,
    })
      .then((res) => { setDocumentos(res.data || []); setTotalItems(res.meta?.total_items || 0); })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los documentos'))
      .finally(() => setCargando(false));
  }, [tipoSeleccionado, estadoFiltro, busqueda, page, pageSize]);

  useEffect(() => { const t = setTimeout(cargarDocumentos, 300); return () => clearTimeout(t); }, [cargarDocumentos]);

  const nombreCarpetaSeleccionada = carpetas.find((c) => c.tipo_documento_id === tipoSeleccionado)?.tipo_documento_nombre;

  return (
    <AppShell titulo="Gestión Documental">
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Gestión Documental</Typography>
          <Typography variant="body2" color="text.secondary">
            {nombreCarpetaSeleccionada || 'Repositorio de documentos del parque automotor'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Vista de tarjetas">
            <IconButton size="small" onClick={() => setVista('grid')} sx={{ border: '1px solid', borderColor: vista === 'grid' ? 'primary.main' : 'divider', bgcolor: vista === 'grid' ? 'primary.main' : 'transparent', color: vista === 'grid' ? '#fff' : 'text.secondary' }}>
              <GridViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Vista de lista">
            <IconButton size="small" onClick={() => setVista('list')} sx={{ border: '1px solid', borderColor: vista === 'list' ? 'primary.main' : 'divider', bgcolor: vista === 'list' ? 'primary.main' : 'transparent', color: vista === 'list' ? '#fff' : 'text.secondary' }}>
              <ViewListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {estadoFiltro && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Filtro activo:</Typography>
          <Chip
            label={estadoFiltro === 'Vencido' ? '🔴 Vencidos' : estadoFiltro === 'Proximo_a_vencer' ? '🟡 Próximos a vencer' : estadoFiltro}
            size="small"
            color={estadoFiltro === 'Vencido' ? 'error' : 'warning'}
            onDelete={() => { setEstadoFiltro(undefined); setPage(0); }}
          />
        </Stack>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        Para subir o renovar un documento, abre la ficha del vehículo correspondiente.
      </Alert>

      {/* ── Carpetas ── */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', fontSize: '0.72rem' }}>
        Tipos de documento
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {carpetas.map((c) => {
          const cfg = CONFIG_TIPO[c.tipo_documento_nombre] || CONFIG_DEFAULT;
          const Icono = cfg.icono;
          const seleccionada = tipoSeleccionado === c.tipo_documento_id;
          return (
            <Grid item xs={6} sm={4} md={2} key={c.tipo_documento_id}>
              <Box
                onClick={() => { setTipoSeleccionado(seleccionada ? null : c.tipo_documento_id); setPage(0); setEstadoFiltro(undefined); }}
                sx={{
                  borderRadius: '16px',
                  background: cfg.gradiente,
                  p: 2,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  outline: seleccionada ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                  outlineOffset: 2,
                  boxShadow: seleccionada
                    ? `0 6px 20px ${alpha(theme.palette.primary.main, 0.35)}`
                    : '0 2px 8px rgba(0,0,0,0.12)',
                  transition: 'all 0.18s ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0,0,0,0.18)' },
                }}
              >
                {/* Círculo decorativo */}
                <Box aria-hidden sx={{ position: 'absolute', top: -16, right: -16, width: 60, height: 60, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.12)', pointerEvents: 'none' }} />
                <Box sx={{ mb: 1.5 }}><Icono /></Box>
                <Typography variant="body2" fontWeight={700} noWrap sx={{ color: '#fff', fontSize: '0.78rem' }}>
                  {c.tipo_documento_nombre}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                  {c.total} archivo{c.total !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* ── Listado de documentos ── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5} sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {tipoSeleccionado ? `Documentos — ${nombreCarpetaSeleccionada}` : 'Documentos recientes'}
        </Typography>
        <TextField
          size="small"
          placeholder="Buscar por placa…"
          value={busqueda}
          onChange={(e) => { setPage(0); setBusqueda(e.target.value); }}
          InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
          sx={{ maxWidth: 260 }}
        />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {cargando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : documentos.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">No hay documentos que coincidan.</Typography>
        </Paper>
      ) : vista === 'grid' ? (
        <Grid container spacing={2}>
          {documentos.map((doc) => {
            const cfg = CONFIG_TIPO[doc.tipo_documento_nombre || ''] || CONFIG_DEFAULT;
            const estado = ESTADO_ESTILO[doc.estado_documento] || ESTADO_ESTILO['Pendiente'];
            return (
              <Grid item xs={6} sm={4} md={3} key={doc.id}>
                <Box
                  sx={{
                    borderRadius: '14px',
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.paper',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                    transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                    '&:hover': { boxShadow: '0 4px 14px rgba(0,0,0,0.12)', transform: 'translateY(-1px)' },
                  }}
                >
                  {/* Cabecera de color */}
                  <Box sx={{ background: cfg.gradiente, px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <cfg.icono />
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#fff', fontSize: '0.7rem' }} noWrap>
                      {doc.tipo_documento_nombre}
                    </Typography>
                  </Box>
                  {/* Contenido */}
                  <Box sx={{ p: 1.5, flex: 1 }}>
                    <Typography variant="caption" fontWeight={600} noWrap sx={{ display: 'block', mb: 0.5 }}>
                      {doc.nombre_archivo || `${doc.tipo_documento_nombre} — ${doc.vehiculo_placa}`}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.75 }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: estado.dot, flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ color: estado.dot, fontWeight: 600, fontSize: '0.65rem' }}>
                        {estado.label}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                      {doc.vehiculo_placa && <><strong>{doc.vehiculo_placa}</strong> · </>}
                      {new Date(doc.fecha_carga).toLocaleDateString('es-CO')}
                      {doc.tamano_bytes ? ` · ${formatearTamano(doc.tamano_bytes)}` : ''}
                    </Typography>
                  </Box>
                  {doc.archivo_url && (
                    <Box sx={{ px: 1.5, pb: 1.5 }}>
                      <IconButton size="small" component="a" href={doc.archivo_url} target="_blank" rel="noopener" sx={{ bgcolor: 'action.hover', borderRadius: 1.5, p: 0.6 }}>
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Paper>
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Placa</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Tamaño</TableCell>
                  <TableCell align="right">Abrir</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documentos.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell>{doc.nombre_archivo || '—'}</TableCell>
                    <TableCell>{doc.tipo_documento_nombre}</TableCell>
                    <TableCell>
                      <Chip label={doc.vehiculo_placa} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
                    </TableCell>
                    <TableCell><StatusBadge estado={doc.estado_documento} /></TableCell>
                    <TableCell>{new Date(doc.fecha_carga).toLocaleDateString('es-CO')}</TableCell>
                    <TableCell>{doc.tamano_bytes ? formatearTamano(doc.tamano_bytes) : '—'}</TableCell>
                    <TableCell align="right">
                      {doc.archivo_url && (
                        <IconButton size="small" component="a" href={doc.archivo_url} target="_blank" rel="noopener">
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {totalItems > 0 && (
        <TablePagination
          component="div"
          count={totalItems}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[12, 24, 48]}
          labelRowsPerPage="Por página"
        />
      )}
    </AppShell>
  );
}

export default function DocumentosPage() {
  return <Suspense fallback={null}><DocumentosContent /></Suspense>;
}
