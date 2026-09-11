'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Paper, TextField, MenuItem, Button, Table, TableHead, TableBody,
  TableRow, TableCell, TablePagination, IconButton, Typography,
  CircularProgress, Alert, Stack, Tooltip, Chip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import FilterListIcon from '@mui/icons-material/FilterListOutlined';
import AppShell from '@/components/layout/app-shell';
import StatusBadge from '@/components/ui/status-badge';
import VehiculoFormDialog from '@/components/vehiculos/vehiculo-form-dialog';
import { useAuth } from '@/contexts/auth-context';
import { useCatalogos } from '@/lib/hooks/use-catalogos';
import { vehiculosService } from '@/lib/services';
import { ApiError } from '@/lib/api-client';
import type { Vehiculo } from '@/types';

const ROLES_PUEDEN_CREAR = ['Administrador'];

function DocEstadoDot({ estado }: { estado?: string | null }) {
  const color = !estado ? '#D1D5DB'
    : estado === 'Vigente' ? '#16A34A'
    : estado === 'Proximo_a_vencer' ? '#F59E0B'
    : estado === 'Vencido' ? '#DA151C'
    : '#D1D5DB';
  const label = !estado ? 'Sin cargar'
    : estado === 'Vigente' ? 'Vigente'
    : estado === 'Proximo_a_vencer' ? 'Por vencer'
    : estado === 'Vencido' ? 'Vencido'
    : 'Sin cargar';
  return (
    <Tooltip title={label}>
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, display: 'inline-block', cursor: 'default', boxShadow: `0 0 0 2px ${alpha(color, 0.25)}` }} />
    </Tooltip>
  );
}

function VehiculosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { usuario } = useAuth();
  const { catalogos, dependencias } = useCatalogos();
  const theme = useTheme();

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [placa, setPlaca] = useState(searchParams.get('placa') || '');
  const [dependenciaId, setDependenciaId] = useState<number | ''>('');
  const [tipoVehiculoId, setTipoVehiculoId] = useState<number | ''>('');
  // Si viene estado_id desde URL (ej: click en card del dashboard) usarlo directamente
  const estadoIdUrl = searchParams.get('estado_id');
  const [estadoId, setEstadoId] = useState<number | ''>(estadoIdUrl ? Number(estadoIdUrl) : '');

  // Sincroniza la placa cuando cambia el parámetro de la URL (ej: búsqueda
  // desde el topbar mientras ya se está en /vehiculos — Next.js no remonta
  // el componente al navegar a la misma ruta, así que sin este efecto el
  // useState inicial de `placa` nunca se actualiza y la búsqueda no ocurre).
  useEffect(() => {
    const placaUrl = searchParams.get('placa');
    if (placaUrl !== null) {
      setPlaca(placaUrl);
      setPage(0);
    }
  }, [searchParams]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  // Flag para no sobrescribir el estado_id que vino de la URL con el default "Activo"
  const [estadoInicialAplicado, setEstadoInicialAplicado] = useState(!!estadoIdUrl);

  // Pre-seleccionar "Activo" si no vino estado_id por URL
  useEffect(() => {
    if (!estadoInicialAplicado && catalogos?.estados_vehiculo.length) {
      const activo = catalogos.estados_vehiculo.find((e) => e.nombre === 'Activo');
      if (activo) {
        setEstadoId(activo.id);
        setEstadoInicialAplicado(true);
      }
    }
  }, [catalogos, estadoInicialAplicado]);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    vehiculosService.listar({
      placa: placa || undefined,
      dependencia_id: dependenciaId || undefined,
      tipo_vehiculo_id: tipoVehiculoId || undefined,
      estado_id: estadoId || undefined,
      page: page + 1,
      page_size: pageSize,
    })
      .then((res) => { setVehiculos(res.data || []); setTotalItems(res.meta?.total_items || 0); })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los vehículos'))
      .finally(() => setCargando(false));
  }, [placa, dependenciaId, tipoVehiculoId, estadoId, page, pageSize]);

  useEffect(() => { const t = setTimeout(cargar, 300); return () => clearTimeout(t); }, [cargar]);

  const puedeCrear = usuario && ROLES_PUEDEN_CREAR.includes(usuario.rol_nombre);
  const filtrosActivos = !!(placa || dependenciaId || tipoVehiculoId || estadoId);

  return (
    <AppShell titulo="Vehículos">
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Vehículos</Typography>
          <Typography variant="body2" color="text.secondary">
            {totalItems} vehículo{totalItems !== 1 ? 's' : ''} registrado{totalItems !== 1 ? 's' : ''} en el sistema
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="La exportación a Excel llega en la Fase 4 del proyecto">
            <span><Button variant="outlined" startIcon={<DownloadIcon />} disabled size="small">Exportar Excel</Button></span>
          </Tooltip>
          {puedeCrear && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogoAbierto(true)} size="small">
              Nuevo vehículo
            </Button>
          )}
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1.5 }}>
          <FilterListIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
          <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.07em', color: 'text.secondary', fontSize: '0.68rem' }}>Filtros</Typography>
          {filtrosActivos && (
            <Chip
              label="Limpiar"
              size="small"
              color="primary"
              variant="outlined"
              onDelete={() => {
                setPlaca(''); setDependenciaId(''); setTipoVehiculoId(''); setPage(0);
                // Al limpiar, volver a poner "Activo" como default
                const activo = catalogos?.estados_vehiculo.find((e) => e.nombre === 'Activo');
                setEstadoId(activo ? activo.id : '');
              }}
              sx={{ height: 18, fontSize: '0.65rem' }}
            />
          )}
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <TextField label="Buscar por placa" size="small" value={placa} onChange={(e) => { setPage(0); setPlaca(e.target.value); }} sx={{ minWidth: 180 }} inputProps={{ style: { textTransform: 'uppercase' } }} />
          <TextField select label="Dependencia" size="small" value={dependenciaId} onChange={(e) => { setPage(0); setDependenciaId(e.target.value ? Number(e.target.value) : ''); }} sx={{ minWidth: 180 }}>
            <MenuItem value="">Todas</MenuItem>
            {dependencias.map((d) => <MenuItem key={d.id} value={d.id}>{d.nombre}</MenuItem>)}
          </TextField>
          <TextField select label="Tipo" size="small" value={tipoVehiculoId} onChange={(e) => { setPage(0); setTipoVehiculoId(e.target.value ? Number(e.target.value) : ''); }} sx={{ minWidth: 150 }}>
            <MenuItem value="">Todos</MenuItem>
            {catalogos?.tipos_vehiculo.map((t) => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
          </TextField>
          <TextField select label="Estado" size="small" value={estadoId} onChange={(e) => { setPage(0); setEstadoId(e.target.value ? Number(e.target.value) : ''); }} sx={{ minWidth: 160 }}>
            <MenuItem value="">Todos</MenuItem>
            {catalogos?.estados_vehiculo.map((es) => <MenuItem key={es.id} value={es.id}>{es.nombre}</MenuItem>)}
          </TextField>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ overflow: 'hidden' }}>
        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : vehiculos.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography color="text.secondary" fontWeight={500}>No hay vehículos que coincidan con los filtros.</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Placa</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Marca / Línea</TableCell>
                    <TableCell>Dependencia</TableCell>
                    <TableCell>Responsable</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">
                      <Tooltip title="SOAT · Tecnomecánica"><span>Docs.</span></Tooltip>
                    </TableCell>
                    <TableCell align="right" sx={{ width: 56 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehiculos.map((v) => (
                    <TableRow key={v.id} hover sx={{ cursor: 'pointer', '&:hover .ver-btn': { opacity: 1 } }} onClick={() => router.push(`/vehiculos/${v.id}`)}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', letterSpacing: '0.05em', color: 'primary.main' }}>{v.placa}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{v.tipo_vehiculo_nombre}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2">{[v.marca, v.linea].filter(Boolean).join(' ') || '—'}</Typography>
                        {v.modelo && <Typography variant="caption" color="text.disabled">{v.modelo}</Typography>}
                      </TableCell>
                      <TableCell><Typography variant="body2">{v.dependencia_nombre || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{v.responsable_nombre || '—'}</Typography></TableCell>
                      <TableCell><StatusBadge estado={v.estado_nombre || ''} /></TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                          <DocEstadoDot estado={v.soat_estado} />
                          <DocEstadoDot estado={v.tecno_estado} />
                        </Stack>
                      </TableCell>
                      <TableCell align="right" onClick={(e) => { e.stopPropagation(); router.push(`/vehiculos/${v.id}`); }}>
                        <IconButton size="small" className="ver-btn" sx={{ opacity: 0, transition: 'opacity 0.15s ease', bgcolor: alpha(theme.palette.primary.main, 0.08), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) } }}>
                          <VisibilityIcon fontSize="small" sx={{ color: 'primary.main' }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <TablePagination
              component="div"
              count={totalItems}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[10, 20, 50]}
              labelRowsPerPage="Filas por página"
            />
          </>
        )}
      </Paper>

      <VehiculoFormDialog abierto={dialogoAbierto} onCerrar={() => setDialogoAbierto(false)} onGuardado={() => { setDialogoAbierto(false); cargar(); }} />
    </AppShell>
  );
}

export default function VehiculosPage() {
  return <Suspense fallback={null}><VehiculosContent /></Suspense>;
}
