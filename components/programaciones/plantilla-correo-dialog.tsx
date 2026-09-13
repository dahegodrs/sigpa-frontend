'use client';

import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, Alert, Typography, Chip, Stack, Box, Divider, CircularProgress,
} from '@mui/material';
import { plantillaCorreoService } from '@/lib/services';
import { ApiError } from '@/lib/api-client';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

const VARIABLES_DISPONIBLES = [
  { clave: '{{nombre_solicitante}}', descripcion: 'Nombre de quien pidió el vehículo' },
  { clave: '{{fecha_servicio}}', descripcion: 'Fecha del servicio solicitado' },
  { clave: '{{detalle_aprobadas}}', descripcion: 'Bloque HTML con las solicitudes aprobadas (vehículo, conductor, horario)' },
  { clave: '{{detalle_rechazadas}}', descripcion: 'Bloque HTML con las solicitudes rechazadas y su motivo' },
];

// Editor de la plantilla de correo que se envía al solicitante cuando el
// director aprueba/rechaza su(s) solicitud(es) de vehículo. Se guarda en
// base de datos (no localStorage) para que la vea/edite cualquier
// Administrador, y usa la identidad visual de la Alcaldía de Funza.
export default function PlantillaCorreoDialog({ abierto, onCerrar }: Props) {
  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setCargando(true);
    setError(null);
    setExito(false);
    plantillaCorreoService.obtenerSolicitudVehiculo()
      .then((res) => {
        setAsunto(res.asunto);
        setCuerpo(res.cuerpo_html);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudo cargar la plantilla'))
      .finally(() => setCargando(false));
  }, [abierto]);

  const guardar = async () => {
    if (!asunto.trim() || !cuerpo.trim()) {
      setError('El asunto y el cuerpo del correo son obligatorios');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await plantillaCorreoService.guardarSolicitudVehiculo({ asunto: asunto.trim(), cuerpo_html: cuerpo.trim() });
      setExito(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la plantilla');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="md" fullWidth>
      <DialogTitle>Plantilla de notificación a solicitantes</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Este correo se envía automáticamente al solicitante cuando guardas cambios en una programación
          y hay solicitudes suyas aprobadas o rechazadas. Se envía un solo correo consolidado por persona,
          incluso si tenía varias solicitudes para el mismo día.
        </Typography>

        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <Grid container spacing={2.5}>
            {error && <Grid item xs={12}><Alert severity="error">{error}</Alert></Grid>}
            {exito && <Grid item xs={12}><Alert severity="success">Plantilla guardada correctamente.</Alert></Grid>}

            <Grid item xs={12}>
              <TextField label="Asunto del correo" fullWidth size="small" value={asunto} onChange={(e) => setAsunto(e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Cuerpo del correo (HTML)"
                fullWidth
                multiline
                minRows={10}
                value={cuerpo}
                onChange={(e) => setCuerpo(e.target.value)}
                sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 13 } }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ mb: 1.5 }} />
              <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 1 }}>
                Variables disponibles
              </Typography>
              <Stack spacing={0.75}>
                {VARIABLES_DISPONIBLES.map((v) => (
                  <Stack key={v.clave} direction="row" spacing={1.5} alignItems="center">
                    <Chip label={v.clave} size="small" sx={{ fontFamily: 'monospace', bgcolor: '#EAF2FF' }} />
                    <Typography variant="caption" color="text.secondary">{v.descripcion}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar} disabled={guardando}>Cerrar</Button>
        <Button variant="contained" onClick={guardar} disabled={guardando || cargando}>
          {guardando ? 'Guardando…' : 'Guardar plantilla'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
