'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Paper, Typography, CircularProgress, Alert, Stack, Button,
  Table, TableHead, TableBody, TableRow, TableCell, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AppShell from '@/components/layout/app-shell';
import { solicitudesVehiculoService } from '@/lib/services';
import { ApiError } from '@/lib/api-client';
import type { ProgramacionItem } from '@/types';

function formatFecha(fecha?: string) {
  if (!fecha) return '—';
  const d = new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

// Timeline tipo "pasarela de pago": Solicitado (siempre completo) → En
// espera de aprobación → Aprobada/Rechazada. Se implementa como 3 círculos
// conectados por una línea, en vez del componente Stepper de MUI (pensado
// para formularios paso a paso), porque aquí necesitamos un estado FINAL
// que puede ser positivo o negativo (aprobada vs rechazada), no un simple
// avance lineal.
function TimelineSolicitud({ item }: { item: ProgramacionItem }) {
  const estado = item.estado_solicitud || 'pendiente';

  const pasos = [
    { label: 'Solicitado', activo: true, color: '#2563EB' },
    {
      label: estado === 'pendiente' ? 'En espera de aprobación' : estado === 'aprobada' ? 'Aprobada' : 'Rechazada',
      activo: estado !== 'pendiente' || true, // el paso 2 siempre está "vivo" (pendiente = en curso)
      color: estado === 'aprobada' ? '#16A34A' : estado === 'rechazada' ? '#DA151C' : '#F59E0B',
    },
  ];

  return (
    <Stack direction="row" alignItems="center" spacing={0}>
      {pasos.map((paso, i) => (
        <Stack key={i} direction="row" alignItems="center">
          <Tooltip title={paso.label}>
            <Box
              sx={{
                width: 28, height: 28, borderRadius: '50%', bgcolor: paso.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: `0 0 0 3px ${paso.color}22`,
              }}
            >
              {i === 0 ? (
                <CheckIcon sx={{ fontSize: 16, color: '#fff' }} />
              ) : estado === 'aprobada' ? (
                <CheckIcon sx={{ fontSize: 16, color: '#fff' }} />
              ) : estado === 'rechazada' ? (
                <CloseIcon sx={{ fontSize: 16, color: '#fff' }} />
              ) : (
                <HourglassEmptyIcon sx={{ fontSize: 14, color: '#fff' }} />
              )}
            </Box>
          </Tooltip>
          {i < pasos.length - 1 && (
            <Box sx={{ width: 32, height: 2, bgcolor: pasos[i + 1].color, opacity: 0.4 }} />
          )}
        </Stack>
      ))}
      <Typography variant="caption" sx={{ ml: 1.5, fontWeight: 600, color: pasos[1].color, whiteSpace: 'nowrap' }}>
        {pasos[1].label}
      </Typography>
    </Stack>
  );
}

export default function MisSolicitudesPage() {
  const router = useRouter();
  const [lista, setLista] = useState<ProgramacionItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    solicitudesVehiculoService.misSolicitudes()
      .then((res) => setLista(res || []))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar tus solicitudes'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <AppShell titulo="Mis Solicitudes">
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Mis solicitudes de vehículo</Typography>
          <Typography variant="body2" color="text.secondary">
            {lista.length} solicitud{lista.length !== 1 ? 'es' : ''} registrada{lista.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/solicitar-vehiculo')}>
          Nueva solicitud
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ overflow: 'hidden' }}>
        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : lista.length === 0 ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <EventNoteOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
            <Typography fontWeight={600} color="text.secondary">Todavía no has hecho ninguna solicitud</Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              Solicita tu primer vehículo desde el botón "Nueva solicitud".
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={() => router.push('/solicitar-vehiculo')}>
              Nueva solicitud
            </Button>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Hora / Punto</TableCell>
                  <TableCell>Destino</TableCell>
                  <TableCell>Actividad</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Vehículo / Conductor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lista.map((item) => {
                  const asignado = !!item.vehiculo_id && item.conductor !== 'DISPONIBLE PATIO';
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                          {formatFecha(item.fecha_programacion)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.hora_solicitada || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.punto_encuentro}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2">{item.destino}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{item.actividad}</Typography></TableCell>
                      <TableCell>
                        <TimelineSolicitud item={item} />
                        {item.estado_solicitud === 'rechazada' && item.motivo_rechazo && (
                          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                            Motivo: {item.motivo_rechazo}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {asignado ? (
                          <Tooltip title={item.motivo || ''}>
                            <Typography variant="body2">{item.vehiculo_placa} — {item.conductor}</Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.disabled">Sin asignar todavía</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </AppShell>
  );
}
