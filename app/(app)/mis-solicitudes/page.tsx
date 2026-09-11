'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Paper, Typography, CircularProgress, Alert, Stack, Button,
  Table, TableHead, TableBody, TableRow, TableCell, Chip, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import AppShell from '@/components/layout/app-shell';
import { solicitudesVehiculoService } from '@/lib/services';
import { ApiError } from '@/lib/api-client';
import type { ProgramacionItem } from '@/types';

function formatFecha(fecha?: string) {
  if (!fecha) return '—';
  const d = new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
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
            <Table sx={{ minWidth: 760 }}>
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
                        {item.programado ? (
                          <Chip label="Confirmada" size="small" color="success" variant="outlined" />
                        ) : asignado ? (
                          <Chip label="Vehículo asignado" size="small" color="info" variant="outlined" />
                        ) : (
                          <Chip label="Pendiente de asignar" size="small" color="warning" variant="outlined" />
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
