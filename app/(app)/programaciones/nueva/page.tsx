'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Paper, Typography, CircularProgress, Alert, Stack, Button,
  TextField, MenuItem, Checkbox, Tooltip, IconButton, Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
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
  // Por defecto FALSE: el usuario debe marcar explícitamente cada fila que
  // quiere incluir en la planilla oficial. Esto refleja el flujo real: las
  // solicitudes de vehículos van llegando durante el día y solo se
  // "programan" (confirman) las que ya están decididas.
  programado: false,
  vehiculo_id: null,
});

export default function NuevaProgramacionPage() {
  const router = useRouter();
  const theme = useTheme();

  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [observaciones, setObservaciones] = useState('');
  const [filas, setFilas] = useState<ProgramacionItem[]>([FILA_VACIA()]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiando, setCopiando] = useState(false);

  // Catálogos
  const [conductores, setConductores] = useState<ListaConfiguracion[]>([]);
  const [actividades, setActividades] = useState<ListaConfiguracion[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);

  useEffect(() => {
    Promise.all([
      listasService.listar('conductor'),
      listasService.listar('actividad'),
      vehiculosService.listar({ page_size: 200 }),
      dependenciasService.listar(),
      // "Vehículos de patio" es la lista configurada en Administración que
      // define qué placas del parque automotor deben ofrecerse en el
      // combo de esta pantalla — no todo el parque automotor, solo el
      // subconjunto habilitado para programación diaria.
      listasService.listar('patio_vehiculo'),
    ]).then(([conds, acts, vehs, deps, patio]) => {
      setConductores(conds || []);
      setActividades(acts || []);
      setDependencias(deps || []);
      const placasPatio = new Set((patio || []).filter((p) => p.activo).map((p) => p.nombre.toUpperCase()));
      setVehiculos((vehs.data || []).filter((v) => placasPatio.has(v.placa.toUpperCase())));
    }).catch(() => {});
  }, []);

  const actualizarFila = (idx: number, campo: keyof ProgramacionItem, valor: unknown) => {
    setFilas((prev) => prev.map((f, i) => i === idx ? { ...f, [campo]: valor } : f));
  };

  const marcarVacaciones = (idx: number, esVac: boolean) => {
    setFilas((prev) => prev.map((f, i) => i === idx ? {
      ...f,
      es_vacaciones: esVac,
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

  const copiarProgramacionAnterior = async () => {
    setCopiando(true);
    setError(null);
    try {
      const anterior = await programacionesService.obtenerUltima();
      if (!anterior.items || anterior.items.length === 0) {
        setError('La última programación no tiene filas para copiar');
        return;
      }
      // Se copian los datos de cada fila pero SIN el id ni programacion_id
      // (para que se traten como filas nuevas al guardar), preservando
      // vehículo, conductor, dependencia, destino, horas y actividad tal
      // cual quedaron la última vez, así el usuario solo edita lo que
      // cambió en vez de crear todo desde cero.
      setFilas(
        anterior.items.map((item) => ({
          vehiculo_id: item.vehiculo_id ?? null,
          conductor: item.conductor,
          dependencia: item.dependencia,
          destino: item.destino,
          hora_salida_punto: item.hora_salida_punto,
          hora_finalizacion: item.hora_finalizacion || 'DISPONIBLE PATIO',
          actividad: item.actividad,
          es_vacaciones: item.es_vacaciones,
          programado: false,
        }))
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No hay programaciones anteriores para copiar');
    } finally {
      setCopiando(false);
    }
  };

  const guardar = async () => {
    if (!fecha) { setError('La fecha es obligatoria'); return; }
    if (filas.length === 0) { setError('Agrega al menos una fila'); return; }
    setGuardando(true);
    setError(null);
    try {
      const result = await programacionesService.crear({
        fecha,
        observaciones: observaciones || undefined,
        // Se guardan TODAS las filas (marcadas o no) — "programado" solo
        // controla qué aparece en el PDF/planilla oficial, no si la fila
        // se conserva en el sistema. Así el usuario puede ir agregando
        // solicitudes de vehículos durante el día sin perder las que aún
        // no ha confirmado.
        items: filas.map((f, i) => ({ ...f, orden: i })),
      });
      router.push(`/programaciones/${result.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la programación');
    } finally { setGuardando(false); }
  };

  return (
    <AppShell titulo="Nueva Programación">
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/programaciones')} sx={{ mb: 2 }} size="small">
        Volver al listado
      </Button>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Cabecera del formulario */}
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Datos de la programación</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Fecha"
            type="date"
            size="small"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 200 }}
          />
          <TextField
            label="Observaciones (opcional)"
            size="small"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            sx={{ flex: 1 }}
          />
        </Stack>
      </Paper>

      {/* Tabla de filas */}
      <Paper sx={{ overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2.5, py: 1.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Filas de la programación ({filas.length})
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Trae las filas de la última programación guardada, para editarlas en vez de crearlas una por una">
              <span>
                <Button
                  size="small"
                  startIcon={copiando ? <CircularProgress size={14} color="inherit" /> : <ContentCopyOutlinedIcon />}
                  variant="outlined"
                  color="secondary"
                  onClick={copiarProgramacionAnterior}
                  disabled={copiando}
                >
                  {copiando ? 'Copiando…' : 'Copiar programación anterior'}
                </Button>
              </span>
            </Tooltip>
            <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={agregarFila}>
              Agregar fila
            </Button>
          </Stack>
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 1150 }}>
            {/* Cabecera */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '32px 130px 1fr 1fr 1fr 1fr 1fr 1fr 70px', gap: 0.5, px: 1.5, py: 1, bgcolor: '#FAFAFA', borderBottom: '2px solid', borderColor: 'divider' }}>
              {['', 'VEHÍCULO', 'CONDUCTOR', 'DEPENDENCIA', 'DESTINO', 'HORA DE SERVICIO Y PUNTO', 'HORA DE FINALIZACIÓN', 'ACTIVIDAD', ''].map((h, i) => (
                <Typography key={i} variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', fontSize: '0.65rem', display: 'flex', alignItems: 'center' }}>
                  {h}
                </Typography>
              ))}
            </Box>

            {/* Filas */}
            {filas.map((fila, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '32px 130px 1fr 1fr 1fr 1fr 1fr 1fr 70px',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.75,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: fila.es_vacaciones ? '#FFF8E1' : idx % 2 === 0 ? 'background.paper' : alpha(theme.palette.text.primary, 0.02),
                  alignItems: 'center',
                  opacity: fila.programado ? 1 : 0.55,
                }}
              >
                <Stack direction="row" alignItems="center">
                  <DragIndicatorIcon sx={{ color: 'text.disabled', fontSize: 16 }} />
                </Stack>

                <TextField
                  select size="small" value={fila.vehiculo_id ?? ''}
                  onChange={(e) => actualizarFila(idx, 'vehiculo_id', e.target.value ? Number(e.target.value) : null)}
                  disabled={fila.es_vacaciones}
                  sx={{ '& .MuiInputBase-root': { fontSize: 12 } }}
                >
                  <MenuItem value=""><em>Sin vehículo</em></MenuItem>
                  {vehiculos.map((v) => <MenuItem key={v.id} value={v.id}>{v.placa}</MenuItem>)}
                </TextField>

                <TextField
                  select size="small" value={fila.conductor}
                  onChange={(e) => actualizarFila(idx, 'conductor', e.target.value)}
                  sx={{ '& .MuiInputBase-root': { fontSize: 12 } }}
                >
                  {conductores.map((c) => <MenuItem key={c.id} value={c.nombre}>{c.nombre}</MenuItem>)}
                </TextField>

                <TextField
                  select size="small" value={fila.dependencia}
                  onChange={(e) => actualizarFila(idx, 'dependencia', e.target.value)}
                  disabled={fila.es_vacaciones}
                  sx={{ '& .MuiInputBase-root': { fontSize: 12 } }}
                >
                  <MenuItem value="DISPONIBLE PATIO">DISPONIBLE PATIO</MenuItem>
                  {fila.es_vacaciones && <MenuItem value="VACACIONES">VACACIONES</MenuItem>}
                  {dependencias.map((d) => <MenuItem key={d.id} value={d.nombre}>{d.nombre}</MenuItem>)}
                </TextField>

                <TextField
                  size="small" value={fila.destino}
                  onChange={(e) => actualizarFila(idx, 'destino', e.target.value)}
                  disabled={fila.es_vacaciones}
                  inputProps={{ style: { fontSize: 12 } }}
                />

                <TextField
                  size="small" value={fila.hora_salida_punto}
                  onChange={(e) => actualizarFila(idx, 'hora_salida_punto', e.target.value)}
                  disabled={fila.es_vacaciones}
                  inputProps={{ style: { fontSize: 12 } }}
                />

                <TextField
                  size="small" value={fila.hora_finalizacion}
                  onChange={(e) => actualizarFila(idx, 'hora_finalizacion', e.target.value)}
                  disabled={fila.es_vacaciones}
                  inputProps={{ style: { fontSize: 12 } }}
                />

                <TextField
                  select size="small" value={fila.actividad}
                  onChange={(e) => actualizarFila(idx, 'actividad', e.target.value)}
                  disabled={fila.es_vacaciones}
                  sx={{ '& .MuiInputBase-root': { fontSize: 12 } }}
                >
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
                    <Checkbox
                      checked={fila.es_vacaciones}
                      onChange={(e) => marcarVacaciones(idx, e.target.checked)}
                      size="small"
                      sx={{ p: 0.5, color: '#F59E0B', '&.Mui-checked': { color: '#F59E0B' } }}
                    />
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
          <Button size="small" startIcon={<AddIcon />} onClick={agregarFila}>
            + Agregar fila
          </Button>
        </Box>
      </Paper>

      {/* Acciones */}
      <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
        <Button variant="outlined" onClick={() => router.push('/programaciones')} disabled={guardando}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={guardando ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
          onClick={guardar}
          disabled={guardando}
        >
          {guardando ? 'Guardando…' : 'Guardar programación'}
        </Button>
      </Stack>
    </AppShell>
  );
}
