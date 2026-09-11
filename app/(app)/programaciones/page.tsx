'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Paper, Typography, CircularProgress, Alert, Stack, Button,
  Table, TableHead, TableBody, TableRow, TableCell, IconButton, Chip, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AppShell from '@/components/layout/app-shell';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { programacionesService } from '@/lib/services';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import type { Programacion } from '@/types';

function formatFecha(fecha: string) {
  const d = new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ProgramacionesPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [lista, setLista] = useState<Programacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programacionEliminar, setProgramacionEliminar] = useState<Programacion | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const puedeCrear = usuario && ['Administrador', 'Dependencia'].includes(usuario.rol_nombre);
  const puedeEliminar = usuario?.rol_nombre === 'Administrador';

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    programacionesService.listar()
      .then((res) => setLista(res || []))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las programaciones'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const confirmarEliminar = async () => {
    if (!programacionEliminar) return;
    setEliminando(true);
    try {
      await programacionesService.eliminar(programacionEliminar.id);
      setProgramacionEliminar(null);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <AppShell titulo="Programación Diaria">
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Programación Diaria de Vehículos</Typography>
          <Typography variant="body2" color="text.secondary">
            Formato 15-FR-36 — {lista.length} programación{lista.length !== 1 ? 'es' : ''} registrada{lista.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        {puedeCrear && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push('/programaciones/nueva')}>
            Nueva programación
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ overflow: 'hidden' }}>
        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : lista.length === 0 ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <CalendarMonthOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
            <Typography fontWeight={600} color="text.secondary">No hay programaciones todavía</Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              Crea la primera programación diaria de vehículos.
            </Typography>
            {puedeCrear && (
              <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={() => router.push('/programaciones/nueva')}>
                Nueva programación
              </Button>
            )}
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell align="center">N° de filas</TableCell>
                <TableCell>Creada por</TableCell>
                <TableCell>Registrada</TableCell>
                <TableCell align="right" sx={{ width: 100 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lista.map((p) => (
                <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/programaciones/${p.id}`)}>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CalendarMonthOutlinedIcon sx={{ color: '#fff', fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                          {formatFecha(p.fecha)}
                        </Typography>
                        {p.observaciones && (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 300, display: 'block' }}>
                            {p.observaciones}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={`${p.total_items ?? 0} fila(s) registrada(s) en total, ${p.total_programados ?? 0} marcada(s) como Programado`}>
                      <Chip
                        label={`${p.total_programados ?? 0} programado${(p.total_programados ?? 0) !== 1 ? 's' : ''}`}
                        size="small"
                        color={(p.total_programados ?? 0) > 0 ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{p.creado_por_nombre || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(p.fecha_creacion).toLocaleDateString('es-CO')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                      <IconButton size="small" onClick={() => router.push(`/programaciones/${p.id}`)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      {puedeEliminar && (
                        <IconButton size="small" onClick={() => setProgramacionEliminar(p)} sx={{ color: 'error.main' }}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <ConfirmDialog
        abierto={!!programacionEliminar}
        titulo="Eliminar programación"
        mensaje={`¿Eliminar la programación del ${programacionEliminar ? formatFecha(programacionEliminar.fecha) : ''}? Esta acción no se puede deshacer.`}
        cargando={eliminando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setProgramacionEliminar(null)}
      />
    </AppShell>
  );
}
