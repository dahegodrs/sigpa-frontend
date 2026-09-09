'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Box, Paper, Typography, CircularProgress, Alert, Stack, Button,
  ToggleButtonGroup, ToggleButton, Chip, Switch, Grid, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCarOutlined';
import { useAuth } from '@/contexts/auth-context';
import AppShell from '@/components/layout/app-shell';
import { alertasService, vehiculosService } from '@/lib/services';
import { ApiError } from '@/lib/api-client';
import type { Alerta, ConfigAlerta, Vehiculo } from '@/types';

type Severidad = 'red' | 'orange' | 'yellow' | 'green';

const SEVERIDAD_POR_NIVEL: Record<string, Severidad> = {
  Critica: 'red', Urgente: 'orange', Prioritaria: 'yellow', Importante: 'yellow', Preventiva: 'green',
};

const ESTILO_SEVERIDAD: Record<Severidad, { label: string; bg: string; color: string; colorActivo: string; icono: typeof ErrorOutlineIcon }> = {
  red:    { label: 'Crítico',     bg: '#FEF2F2', color: '#DA151C', colorActivo: '#A50D13', icono: ErrorOutlineIcon },
  orange: { label: 'Alto',        bg: '#FFF3E8', color: '#C94B0A', colorActivo: '#9A3907', icono: WarningAmberOutlinedIcon },
  yellow: { label: 'Medio',       bg: '#FFFBEB', color: '#B45309', colorActivo: '#8A3E04', icono: WarningAmberOutlinedIcon },
  green:  { label: 'Informativa', bg: '#F0FDF4', color: '#15803D', colorActivo: '#0F5F2D', icono: InfoOutlinedIcon },
};

const TITULO_POR_NIVEL: Record<string, string> = {
  Critica: 'Documento vencido', Urgente: 'Vence mañana',
  Prioritaria: 'Vence en 7 días', Importante: 'Vence en 15 días', Preventiva: 'Vencimiento próximo',
};

const NIVELES_DISPONIBLES = ['Preventiva', 'Importante', 'Prioritaria', 'Urgente', 'Critica'];

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AlertasPage() {
  const { usuario } = useAuth();
  const theme = useTheme();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [config, setConfig] = useState<ConfigAlerta[]>([]);
  const [placasPorVehiculo, setPlacasPorVehiculo] = useState<Record<number, string>>({});
  const [filtroSeveridad, setFiltroSeveridad] = useState<Severidad | 'all'>('all');
  const [filtroLeida, setFiltroLeida] = useState<'all' | 'unread'>('all');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogoNuevaRegla, setDialogoNuevaRegla] = useState(false);
  const [ejecutandoRevision, setEjecutandoRevision] = useState(false);
  const [mensajeRevision, setMensajeRevision] = useState<string | null>(null);

  const esAdministrador = usuario?.rol_nombre === 'Administrador';

  const cargar = useCallback(() => {
    setCargando(true); setError(null);
    Promise.all([alertasService.listar(false), alertasService.listarConfig(), vehiculosService.listar({ page_size: 200 })])
      .then(([listaAlertas, listaConfig, vehiculosRes]) => {
        setAlertas(listaAlertas || []);
        setConfig(listaConfig || []);
        const mapa: Record<number, string> = {};
        (vehiculosRes.data || []).forEach((v: Vehiculo) => (mapa[v.id] = v.placa));
        setPlacasPorVehiculo(mapa);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las alertas'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const alertasFiltradas = alertas.filter((a) => {
    const sev = SEVERIDAD_POR_NIVEL[a.tipo_alerta] || 'yellow';
    return (filtroSeveridad === 'all' || sev === filtroSeveridad) && (filtroLeida === 'all' || !a.leida);
  });

  const sinLeer = alertas.filter((a) => !a.leida).length;
  const conteosPorSeveridad: Record<Severidad, number> = { red: 0, orange: 0, yellow: 0, green: 0 };
  alertas.forEach((a) => { conteosPorSeveridad[SEVERIDAD_POR_NIVEL[a.tipo_alerta] || 'yellow']++; });

  const marcarLeida = async (id: number) => {
    try {
      await alertasService.marcarLeida(id);
      setAlertas((prev) => prev.map((a) => a.id === id ? { ...a, leida: true } : a));
    } catch (err) { setError(err instanceof ApiError ? err.message : 'No se pudo marcar'); }
  };

  const marcarTodasLeidas = async () => {
    try {
      await alertasService.marcarTodasLeidas();
      setAlertas((prev) => prev.map((a) => ({ ...a, leida: true })));
    } catch (err) { setError(err instanceof ApiError ? err.message : 'No se pudo actualizar'); }
  };

  const alternarRegla = async (c: ConfigAlerta) => {
    try {
      await alertasService.actualizarConfig(c.id, { dias_antes: c.dias_antes, nivel: c.nivel, activo: !c.activo });
      setConfig((prev) => prev.map((x) => x.id === c.id ? { ...x, activo: !x.activo } : x));
    } catch (err) { setError(err instanceof ApiError ? err.message : 'No se pudo actualizar la regla'); }
  };

  // Ejecuta manualmente el mismo proceso que corre automáticamente cada
  // madrugada (cron): revisa las fechas de vencimiento reales de los
  // documentos en la base de datos y genera las alertas correspondientes
  // según las reglas configuradas. Útil para pruebas — sin esto habría que
  // esperar hasta el próximo día para ver alertas nuevas, o insertarlas a
  // mano directamente en la base de datos.
  const ejecutarRevisionAhora = async () => {
    setEjecutandoRevision(true);
    setMensajeRevision(null);
    setError(null);
    try {
      await alertasService.ejecutarRevisionManual();
      setMensajeRevision('Revisión ejecutada correctamente. Si hay documentos vencidos o próximos a vencer, las alertas ya deberían aparecer en la lista de abajo.');
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo ejecutar la revisión de vencimientos');
    } finally {
      setEjecutandoRevision(false);
    }
  };

  return (
    <AppShell titulo="Centro de Alertas">
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Centro de Alertas</Typography>
          <Typography variant="body2" color="text.secondary">
            {sinLeer > 0 ? `${sinLeer} sin leer · ` : ''}{alertas.length} alertas en total
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" startIcon={<DoneAllIcon />} onClick={marcarTodasLeidas} disabled={sinLeer === 0}>
            Marcar todas leídas
          </Button>
          {esAdministrador && (
            <Button
              variant="outlined"
              size="small"
              color="secondary"
              startIcon={ejecutandoRevision ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon />}
              onClick={ejecutarRevisionAhora}
              disabled={ejecutandoRevision}
            >
              {ejecutandoRevision ? 'Revisando…' : 'Ejecutar revisión ahora'}
            </Button>
          )}
          {esAdministrador && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setDialogoNuevaRegla(true)}>
              Nueva regla
            </Button>
          )}
        </Stack>
      </Stack>

      {mensajeRevision && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMensajeRevision(null)}>
          {mensajeRevision}
        </Alert>
      )}

      {/* KPIs de severidad — clickeables como filtro */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {(['red', 'orange', 'yellow', 'green'] as Severidad[]).map((sev) => {
          const e = ESTILO_SEVERIDAD[sev];
          const IconoSev = e.icono;
          const activo = filtroSeveridad === sev;
          return (
            <Grid item xs={6} sm={3} key={sev}>
              <Box
                onClick={() => setFiltroSeveridad(activo ? 'all' : sev)}
                sx={{
                  // Activo: fondo oscuro del color (no saturado puro)
                  bgcolor: activo ? e.colorActivo : e.bg,
                  borderRadius: 2.5,
                  p: 2,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: activo ? e.colorActivo : alpha(e.color, 0.18),
                  boxShadow: activo ? `0 3px 12px ${alpha(e.colorActivo, 0.35)}` : 'none',
                  transition: 'all 0.18s ease',
                  '&:hover': {
                    boxShadow: `0 4px 14px ${alpha(e.color, 0.22)}`,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="h5" fontWeight={700} sx={{ color: activo ? '#fff' : e.color }}>
                    {conteosPorSeveridad[sev]}
                  </Typography>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: 1.5,
                    bgcolor: activo ? 'rgba(255,255,255,0.18)' : alpha(e.color, 0.10),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IconoSev sx={{ color: activo ? '#fff' : e.color, fontSize: 18 }} />
                  </Box>
                </Stack>
                <Typography variant="caption" fontWeight={600} sx={{ color: activo ? 'rgba(255,255,255,0.88)' : e.color }}>
                  {sev === 'red' ? 'Críticas' : sev === 'orange' ? 'Altas' : sev === 'yellow' ? 'Medias' : 'Informativas'}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Filtro leídas/no leídas */}
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <ToggleButtonGroup size="small" value={filtroLeida} exclusive onChange={(_, v) => v !== null && setFiltroLeida(v)}>
          <ToggleButton value="all">Todas</ToggleButton>
          <ToggleButton value="unread">
            Sin leer {sinLeer > 0 && <Chip label={sinLeer} size="small" color="error" sx={{ ml: 0.5, height: 16, fontSize: 10 }} />}
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {cargando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : alertasFiltradas.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', mb: 3 }}>
          <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography fontWeight={600} color="text.secondary">No hay alertas</Typography>
          <Typography variant="body2" color="text.disabled">No se encontraron alertas con los filtros aplicados.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          {alertasFiltradas.map((a) => {
            const sev = SEVERIDAD_POR_NIVEL[a.tipo_alerta] || 'yellow';
            const estilo = ESTILO_SEVERIDAD[sev];
            const IconoAlerta = estilo.icono;
            return (
              <Paper key={a.id} sx={{ p: 0, display: 'flex', overflow: 'hidden', border: '1px solid', borderColor: !a.leida ? alpha(estilo.color, 0.3) : 'divider', borderLeft: `4px solid ${!a.leida ? estilo.color : alpha(estilo.color, 0.3)}`, transition: 'box-shadow 0.15s ease', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } }}>
                <Box sx={{ width: 48, flexShrink: 0, bgcolor: !a.leida ? estilo.bg : alpha(estilo.bg, 0.5), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconoAlerta sx={{ color: estilo.color, fontSize: 22, opacity: !a.leida ? 1 : 0.5 }} />
                </Box>
                <Box sx={{ flex: 1, p: 2, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: 'wrap' }}>
                    <Chip label={estilo.label} size="small" sx={{ bgcolor: estilo.bg, color: estilo.color, fontWeight: 700, fontSize: '0.68rem', height: 20 }} />
                    <Chip icon={<DirectionsCarIcon sx={{ fontSize: '12px !important' }} />} label={placasPorVehiculo[a.vehiculo_id] || `#${a.vehiculo_id}`} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: 'action.hover', fontSize: '0.7rem', height: 20 }} />
                    {!a.leida && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: estilo.color, flexShrink: 0 }} />}
                  </Stack>
                  <Typography variant="body2" fontWeight={600} sx={{ opacity: a.leida ? 0.65 : 1 }}>{TITULO_POR_NIVEL[a.tipo_alerta] || a.tipo_alerta}</Typography>
                  <Typography variant="caption" color="text.secondary">{a.destinatario} · {a.estado_envio} · {formatearFecha(a.fecha_programada)}</Typography>
                </Box>
                {!a.leida && (
                  <Box sx={{ display: 'flex', alignItems: 'center', pr: 2 }}>
                    <Button size="small" onClick={() => marcarLeida(a.id)} sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>Marcar leída</Button>
                  </Box>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* Reglas de notificación */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Reglas de Notificación</Typography>
        {config.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No hay reglas configuradas todavía.</Typography>
        ) : (
          <Stack divider={<Divider />} spacing={0}>
            {config.map((c) => (
              <Stack key={c.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5 }}>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    Alertar {c.dias_antes} {c.dias_antes === 1 ? 'día' : 'días'} antes del vencimiento
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Nivel: {c.nivel}</Typography>
                </Box>
                <Switch checked={c.activo} onChange={() => alternarRegla(c)} size="small" disabled={!esAdministrador} />
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>

      <NuevaReglaDialog
        abierto={dialogoNuevaRegla}
        onCerrar={() => setDialogoNuevaRegla(false)}
        onCreada={() => { setDialogoNuevaRegla(false); cargar(); }}
      />
    </AppShell>
  );
}

function NuevaReglaDialog({ abierto, onCerrar, onCreada }: { abierto: boolean; onCerrar: () => void; onCreada: () => void }) {
  const [diasAntes, setDiasAntes] = useState('');
  const [nivel, setNivel] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    if (!diasAntes || !nivel) { setError('Completa los días y el nivel'); return; }
    setGuardando(true); setError(null);
    try {
      await alertasService.crearConfig({ dias_antes: Number(diasAntes), nivel });
      setDiasAntes(''); setNivel('');
      onCreada();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la regla');
    } finally { setGuardando(false); }
  };

  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="xs" fullWidth>
      <DialogTitle>Nueva regla de notificación</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Días antes del vencimiento" type="number" size="small" value={diasAntes} onChange={(e) => setDiasAntes(e.target.value)} />
          <TextField select label="Nivel" size="small" value={nivel} onChange={(e) => setNivel(e.target.value)}>
            {NIVELES_DISPONIBLES.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar} disabled={guardando}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
