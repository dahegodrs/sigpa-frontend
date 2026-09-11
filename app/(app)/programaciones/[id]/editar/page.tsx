'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Paper, Typography, CircularProgress, Alert, Stack, Button,
  TextField, MenuItem, Checkbox, Tooltip, IconButton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AppShell from '@/components/layout/app-shell';
import { programacionesService, listasService, vehiculosService, dependenciasService } from '@/lib/services';
import { ApiError } from '@/lib/api-client';
import type { ProgramacionItem, ListaConfiguracion, Vehiculo, Dependencia } from '@/types';

const FILA_VACIA = (): ProgramacionItem => ({
  conductor: 'DISPONIBLE PATIO',
  dependencia: 'DISPONIBLE PATIO',
  destino: 'DISPONIBLE PATIO',
  hora_salida_punto: 'DISPONIBLE PATIO',
  hora_finalizacion: 'DISPONIBLE PATIO',
  actividad: 'DISPONIBLE PATIO',
  es_vacaciones: false,
  // Por defecto FALSE, igual que en "Nueva programación" — el usuario debe
  // confirmar explícitamente cada fila para que salga en la planilla final.
  programado: false,
  vehiculo_id: null,
});

export default function EditarProgramacionPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  const id = Number(params.id);

  const [fecha, setFecha] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [filas, setFilas] = useState<ProgramacionItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [conductores, setConductores] = useState<ListaConfiguracion[]>([]);
  const [actividades, setActividades] = useState<ListaConfiguracion[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);

  const cargar = useCallback(() => {
    setCargando(true);
    Promise.all([
      programacionesService.obtener(id),
      listasService.listar('conductor'),
      listasService.listar('actividad'),
      vehiculosService.listar({ page_size: 200 }),
      dependenciasService.listar(),
      // "Vehículos de patio" filtra el combo de esta pantalla al
      // subconjunto de placas habilitado en Administración → Listas.
      listasService.listar('patio_vehiculo'),
    ]).then(([prog, conds, acts, vehs, deps, patio]) => {
      setFecha(prog.fecha);
      setObservaciones(prog.observaciones || '');
      // Los items ya guardados no tienen hora_finalizacion/programado si
      // vienen de una programación creada antes de este cambio — se
      // completan con valores por defecto para no romper la edición.
      setFilas(
        prog.items?.length
          ? prog.items.map((it) => ({
              ...it,
              hora_finalizacion: it.hora_finalizacion || 'DISPONIBLE PATIO',
              programado: it.programado ?? false,
            }))
          : [FILA_VACIA()]
      );
      setConductores(conds || []);
      setActividades(acts || []);
      setDependencias(deps || []);
      const placasPatio = new Set((patio || []).filter((p) => p.activo).map((p) => p.nombre.toUpperCase()));
      setVehiculos((vehs.data || []).filter((v) => placasPatio.has(v.placa.toUpperCase())));
    }).catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudo cargar'))
      .finally(() => setCargando(false));
  }, [id]);

  useEffect(() => { if (id) cargar(); }, [id, cargar]);

  const actualizarFila = (idx: number, campo: keyof ProgramacionItem, valor: unknown) => {
    setFilas((prev) => prev.map((f, i) => i === idx ? { ...f, [campo]: valor } : f));
  };

  const marcarVacaciones = (idx: number, esVac: boolean) => {
    setFilas((prev) => prev.map((f, i) => i === idx ? {
      ...f, es_vacaciones: esVac,
      dependencia: esVac ? 'VACACIONES' : 'DISPONIBLE PATIO',
      destino: esVac ? 'VACACIONES' : 'DISPONIBLE PATIO',
      hora_salida_punto: esVac ? 'VACACIONES' : 'DISPONIBLE PATIO',
      hora_finalizacion: esVac ? 'VACACIONES' : 'DISPONIBLE PATIO',
      actividad: esVac ? 'VACACIONES' : 'DISPONIBLE PATIO',
    } : f));
  };

  const alternarProgramado = (idx: number, valor: boolean) => {
    setFilas((prev) => prev.map((f, i) => i === idx ? { ...f, programado: valor } : f));
  };

  const agregarFila = () => setFilas((prev) => [...prev, FILA_VACIA()]);
  const eliminarFila = (idx: number) => setFilas((prev) => prev.filter((_, i) => i !== idx));

  const guardar = async () => {
    if (!fecha) { setError('La fecha es obligatoria'); return; }
    setGuardando(true); setError(null);
    try {
      await programacionesService.actualizar(id, {
        fecha, observaciones: observaciones || undefined,
        // Se guardan TODAS las filas, marcadas o no. "programado" solo
        // controla qué sale en el PDF/planilla oficial — las filas sin
        // marcar NO se pierden al guardar, se conservan como borrador
        // para poder confirmarlas más adelante (ej. nuevas solicitudes
        // de vehículo que van llegando durante el día).
        items: filas.map((f, i) => ({ ...f, orden: i })),
      });
      router.push(`/programaciones/${id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar');
    } finally { setGuardando(false); }
  };

  if (cargando) return <AppShell titulo="Editar Programación"><Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box></AppShell>;

  return (
    <AppShell titulo="Editar Programación">
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/programaciones/${id}`)} sx={{ mb: 2 }} size="small">
        Volver
      </Button>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Datos de la programación</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Fecha" type="date" size="small" value={fecha} onChange={(e) => setFecha(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 200 }} />
          <TextField label="Observaciones (opcional)" size="small" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} sx={{ flex: 1 }} />
        </Stack>
      </Paper>

      <Paper sx={{ overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2.5, py: 1.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={600}>Filas ({filas.length})</Typography>
          <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={agregarFila}>Agregar fila</Button>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 1150 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '32px 130px 1fr 1fr 1fr 1fr 1fr 1fr 70px', gap: 0.5, px: 1.5, py: 1, bgcolor: '#FAFAFA', borderBottom: '2px solid', borderColor: 'divider' }}>
              {['', 'VEHÍCULO', 'CONDUCTOR', 'DEPENDENCIA', 'DESTINO', 'HORA DE SERVICIO Y PUNTO', 'HORA DE FINALIZACIÓN', 'ACTIVIDAD', ''].map((h, i) => (
                <Typography key={i} variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', fontSize: '0.65rem', display: 'flex', alignItems: 'center' }}>{h}</Typography>
              ))}
            </Box>
            {filas.map((fila, idx) => (
              <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: '32px 130px 1fr 1fr 1fr 1fr 1fr 1fr 70px', gap: 0.5, px: 1.5, py: 0.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: fila.es_vacaciones ? '#FFF8E1' : idx % 2 === 0 ? 'background.paper' : alpha(theme.palette.text.primary, 0.02), alignItems: 'center', opacity: fila.programado ? 1 : 0.55 }}>
                <Stack direction="row" alignItems="center"><DragIndicatorIcon sx={{ color: 'text.disabled', fontSize: 16 }} /></Stack>
                <TextField select size="small" value={fila.vehiculo_id ?? ''} onChange={(e) => actualizarFila(idx, 'vehiculo_id', e.target.value ? Number(e.target.value) : null)} disabled={fila.es_vacaciones} sx={{ '& .MuiInputBase-root': { fontSize: 12 } }}>
                  <MenuItem value=""><em>Sin vehículo</em></MenuItem>
                  {vehiculos.map((v) => <MenuItem key={v.id} value={v.id}>{v.placa}</MenuItem>)}
                </TextField>
                <TextField select size="small" value={fila.conductor} onChange={(e) => actualizarFila(idx, 'conductor', e.target.value)} sx={{ '& .MuiInputBase-root': { fontSize: 12 } }}>
                  {conductores.map((c) => <MenuItem key={c.id} value={c.nombre}>{c.nombre}</MenuItem>)}
                </TextField>
                <TextField select size="small" value={fila.dependencia} onChange={(e) => actualizarFila(idx, 'dependencia', e.target.value)} disabled={fila.es_vacaciones} sx={{ '& .MuiInputBase-root': { fontSize: 12 } }}>
                  <MenuItem value="DISPONIBLE PATIO">DISPONIBLE PATIO</MenuItem>
                  {fila.es_vacaciones && <MenuItem value="VACACIONES">VACACIONES</MenuItem>}
                  {dependencias.map((d) => <MenuItem key={d.id} value={d.nombre}>{d.nombre}</MenuItem>)}
                </TextField>
                <TextField size="small" value={fila.destino} onChange={(e) => actualizarFila(idx, 'destino', e.target.value)} disabled={fila.es_vacaciones} inputProps={{ style: { fontSize: 12 } }} />
                <TextField size="small" value={fila.hora_salida_punto} onChange={(e) => actualizarFila(idx, 'hora_salida_punto', e.target.value)} disabled={fila.es_vacaciones} inputProps={{ style: { fontSize: 12 } }} />
                <TextField size="small" value={fila.hora_finalizacion} onChange={(e) => actualizarFila(idx, 'hora_finalizacion', e.target.value)} disabled={fila.es_vacaciones} inputProps={{ style: { fontSize: 12 } }} />
                <TextField select size="small" value={fila.actividad} onChange={(e) => actualizarFila(idx, 'actividad', e.target.value)} disabled={fila.es_vacaciones} sx={{ '& .MuiInputBase-root': { fontSize: 12 } }}>
                  {fila.es_vacaciones && <MenuItem value="VACACIONES">VACACIONES</MenuItem>}
                  {actividades.map((a) => <MenuItem key={a.id} value={a.nombre}>{a.nombre}</MenuItem>)}
                </TextField>
                <Stack direction="row" alignItems="center" spacing={0.25}>
                  <Tooltip title={fila.programado ? 'Fila incluida en la planilla final' : 'Fila NO se incluirá en la planilla final'}>
                    <Checkbox
                      checked={fila.programado}
                      onChange={(e) => alternarProgramado(idx, e.target.checked)}
                      size="small"
                      icon={<CheckCircleOutlineIcon fontSize="small" />}
                      checkedIcon={<CheckCircleOutlineIcon fontSize="small" />}
                      sx={{ p: 0.5, color: 'text.disabled', '&.Mui-checked': { color: '#16A34A' } }}
                    />
                  </Tooltip>
                  <Tooltip title={fila.es_vacaciones ? 'Quitar vacaciones' : 'Marcar vacaciones'}>
                    <Checkbox checked={fila.es_vacaciones} onChange={(e) => marcarVacaciones(idx, e.target.checked)} size="small" sx={{ p: 0.5, color: '#F59E0B', '&.Mui-checked': { color: '#F59E0B' } }} />
                  </Tooltip>
                  <IconButton size="small" onClick={() => eliminarFila(idx)} disabled={filas.length === 1} sx={{ color: 'error.main' }}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ px: 1.5, py: 1, bgcolor: 'action.hover' }}>
          <Button size="small" startIcon={<AddIcon />} onClick={agregarFila}>+ Agregar fila</Button>
        </Box>
      </Paper>

      <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
        <Button variant="outlined" onClick={() => router.push(`/programaciones/${id}`)} disabled={guardando}>Cancelar</Button>
        <Button variant="contained" startIcon={guardando ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />} onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </Stack>
    </AppShell>
  );
}
