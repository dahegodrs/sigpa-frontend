'use client';

import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Typography, Chip, Stack, Box, Alert, Divider, CircularProgress, Tooltip,
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
  { clave: '{{detalle_aprobadas}}', descripcion: 'Lista de solicitudes aprobadas (vehículo, conductor, horario)' },
  { clave: '{{detalle_rechazadas}}', descripcion: 'Lista de solicitudes rechazadas y su motivo' },
];

// Editor de la plantilla de correo que se envía al solicitante cuando el
// director aprueba/rechaza su(s) solicitud(es) de vehículo. El cuerpo es
// TEXTO PLANO (igual que la plantilla de renovación de documentos) — el
// backend aplica automáticamente el diseño institucional (header rojo con
// esquinas redondeadas) antes de enviar, así el Administrador nunca ve ni
// tiene que entender HTML. Se guarda en base de datos (no localStorage)
// para que la vea/edite cualquier Administrador.
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
    <Dialog open={abierto} onClose={onCerrar} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>Editar plantilla de correo</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Este correo se envía automáticamente al solicitante cuando guardas cambios en una programación
          y hay solicitudes suyas aprobadas o rechazadas. Los cambios se guardan para todos los correos futuros.
        </Typography>

        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {exito && <Alert severity="success">Plantilla guardada correctamente.</Alert>}

            <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
              Usa <strong>{'{{variable}}'}</strong> para insertar datos dinámicos. Haz clic en un chip para insertarlo.
            </Alert>

            {/* Variables disponibles — mismo patrón que la plantilla de renovación de documentos */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem', display: 'block', mb: 0.75 }}>
                Variables disponibles
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {VARIABLES_DISPONIBLES.map((v) => (
                  <Tooltip key={v.clave} title={v.descripcion} placement="top">
                    <Chip
                      label={v.clave}
                      size="small"
                      variant="outlined"
                      onClick={() => setCuerpo((prev) => prev + ' ' + v.clave)}
                      sx={{ fontFamily: 'monospace', fontSize: '0.72rem', cursor: 'pointer' }}
                    />
                  </Tooltip>
                ))}
              </Stack>
            </Box>

            <Divider />

            <TextField
              label="Asunto (plantilla)"
              fullWidth
              size="small"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
            />

            <TextField
              label="Cuerpo del correo (plantilla)"
              fullWidth
              multiline
              minRows={8}
              maxRows={14}
              size="small"
              value={cuerpo}
              onChange={(e) => setCuerpo(e.target.value)}
              sx={{ '& .MuiInputBase-input': { fontFamily: 'inherit', fontSize: '0.85rem', lineHeight: 1.7 } }}
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar} disabled={guardando}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={guardando || cargando}>
          {guardando ? 'Guardando…' : 'Guardar plantilla'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
