'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Paper, Typography, TextField, MenuItem, Button, Stack,
  CircularProgress, Alert, Grid, Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';
import AppShell from '@/components/layout/app-shell';
import { listasService, solicitudesVehiculoService } from '@/lib/services';
import { ApiError } from '@/lib/api-client';
import type { ListaConfiguracion } from '@/types';

export default function SolicitarVehiculoPage() {
  const theme = useTheme();
  const router = useRouter();

  const [fecha, setFecha] = useState('');
  const [horaSolicitada, setHoraSolicitada] = useState('');
  const [puntoEncuentro, setPuntoEncuentro] = useState('');
  const [destino, setDestino] = useState('');
  const [actividad, setActividad] = useState('');
  const [motivo, setMotivo] = useState('');

  const [actividades, setActividades] = useState<ListaConfiguracion[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    listasService.listar('actividad').then((res) => setActividades(res || [])).catch(() => {});
  }, []);

  const limpiarFormulario = () => {
    setFecha('');
    setHoraSolicitada('');
    setPuntoEncuentro('');
    setDestino('');
    setActividad('');
    setMotivo('');
  };

  const enviar = async () => {
    if (!fecha || !horaSolicitada || !puntoEncuentro.trim() || !destino.trim() || !actividad || !motivo.trim()) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await solicitudesVehiculoService.crear({
        fecha,
        hora_solicitada: horaSolicitada,
        punto_encuentro: puntoEncuentro.trim(),
        destino: destino.trim(),
        actividad,
        motivo: motivo.trim(),
      });
      setEnviado(true);
      limpiarFormulario();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar la solicitud. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AppShell titulo="Solicitar Vehículo">
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        {/* Encabezado */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Box
            sx={{
              width: 48, height: 48, borderRadius: 3,
              bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
            }}
          >
            <DirectionsCarFilledOutlinedIcon sx={{ color: '#fff' }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>Solicitud de vehículo</Typography>
            <Typography variant="body2" color="text.secondary">
              Diligencia este formulario para solicitar un vehículo del parque automotor. Tu solicitud quedará
              registrada en la programación del día indicado, a la espera de asignación de conductor y vehículo.
            </Typography>
          </Box>
        </Stack>

        <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 4 }}>
          {enviado ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 64, height: 64, borderRadius: '50%', bgcolor: alpha('#16A34A', 0.12),
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
                }}
              >
                <CheckCircleOutlineIcon sx={{ color: '#16A34A', fontSize: 34 }} />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>¡Solicitud registrada!</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 420, mx: 'auto' }}>
                Tu solicitud fue enviada correctamente. El área de transporte asignará un conductor y un vehículo
                y podrás ver el estado en cualquier momento desde "Mis solicitudes".
              </Typography>
              <Stack direction="row" spacing={1.5} justifyContent="center">
                <Button variant="outlined" onClick={() => setEnviado(false)}>Hacer otra solicitud</Button>
                <Button variant="contained" onClick={() => router.push('/mis-solicitudes')}>Ver mis solicitudes</Button>
              </Stack>
            </Box>
          ) : (
            <>
              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', fontSize: '0.72rem' }}>
                Datos del servicio
              </Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Fecha del servicio"
                    type="date"
                    fullWidth
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Hora del servicio"
                    type="time"
                    fullWidth
                    value={horaSolicitada}
                    onChange={(e) => setHoraSolicitada(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Punto de encuentro"
                    placeholder="Ej. Parque Principal"
                    fullWidth
                    value={puntoEncuentro}
                    onChange={(e) => setPuntoEncuentro(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Lugar de destino"
                    placeholder="Ej. Bogotá - Registraduría Nacional"
                    fullWidth
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    label="Actividad"
                    fullWidth
                    value={actividad}
                    onChange={(e) => setActividad(e.target.value)}
                    helperText="Selecciona la categoría que mejor describe el servicio"
                  >
                    {actividades.map((a) => (
                      <MenuItem key={a.id} value={a.nombre}>{a.nombre}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3.5 }} />

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', fontSize: '0.72rem' }}>
                Motivo de la solicitud
              </Typography>
              <TextField
                label="Motivo"
                placeholder="Describe brevemente el motivo específico del viaje (ej. Reunión con el Ministerio de Transporte sobre el plan de movilidad)"
                fullWidth
                multiline
                minRows={3}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />

              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={enviando ? <CircularProgress size={16} color="inherit" /> : <SendOutlinedIcon />}
                  onClick={enviar}
                  disabled={enviando}
                  sx={{ px: 4 }}
                >
                  {enviando ? 'Enviando…' : 'Enviar solicitud'}
                </Button>
              </Stack>
            </>
          )}
        </Paper>
      </Box>
    </AppShell>
  );
}
