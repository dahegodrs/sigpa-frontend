'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Paper, Grid, Typography, Button, Divider,
  CircularProgress, Alert, Stack, Chip, IconButton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/EditOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFileOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCarOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AppShell from '@/components/layout/app-shell';
import Tooltip from '@mui/material/Tooltip';
import StatusBadge from '@/components/ui/status-badge';
import VehiculoFormDialog from '@/components/vehiculos/vehiculo-form-dialog';
import DocumentoUploadDialog from '@/components/vehiculos/documento-upload-dialog';
import NotificarDocumentoDialog from '@/components/vehiculos/notificar-documento-dialog';
import HistorialTimeline from '@/components/vehiculos/historial-timeline';
import { useAuth } from '@/contexts/auth-context';
import { useCatalogos } from '@/lib/hooks/use-catalogos';
import { vehiculosService, documentosService, alertasService } from '@/lib/services';
import { ApiError } from '@/lib/api-client';
import type { Vehiculo, Documento, HistorialCambio, Alerta } from '@/types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

const ROLES_PUEDEN_EDITAR = ['Administrador', 'Dependencia'];

const ICONO_POR_TIPO: Record<string, typeof ShieldOutlinedIcon> = {
  SOAT: ShieldOutlinedIcon,
  'Tecnomecánica': BuildOutlinedIcon,
  'Póliza de seguros': DescriptionOutlinedIcon,
  'Tarjeta de propiedad': BadgeOutlinedIcon,
};

function diasHastaVencimiento(fechaVencimiento?: string | null): number | null {
  if (!fechaVencimiento) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const vence = new Date(fechaVencimiento); vence.setHours(0, 0, 0, 0);
  return Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

function DocumentoCard({ doc, vehiculo, puedeEditar, puedeEliminar, onSubir, onEliminado }: { doc: Documento; vehiculo: Vehiculo; puedeEditar: boolean; puedeEliminar: boolean; onSubir: () => void; onEliminado: () => void }) {
  const theme = useTheme();
  const Icono = ICONO_POR_TIPO[doc.tipo_documento_nombre || ''] || DescriptionOutlinedIcon;
  const dias = diasHastaVencimiento(doc.fecha_vencimiento);
  const estaVencido = doc.estado_documento === 'Vencido';
  const estaProximo = doc.estado_documento === 'Proximo_a_vencer';
  const estaVigente = doc.estado_documento === 'Vigente';
  const colorBorde = estaVencido ? theme.palette.error.main : estaProximo ? '#F59E0B' : estaVigente ? '#16A34A' : 'transparent';
  const IconoEstado = estaVencido ? ErrorOutlineIcon : estaProximo ? WarningAmberIcon : estaVigente ? CheckCircleOutlineIcon : null;
  const colorIconoEstado = estaVencido ? 'error.main' : estaProximo ? '#F59E0B' : '#16A34A';
  const [dialogoNotificar, setDialogoNotificar] = useState(false);
  const [dialogoEliminar, setDialogoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const confirmarEliminar = async () => {
    setEliminando(true);
    try {
      await documentosService.eliminar(vehiculo.id, doc.id);
      setDialogoEliminar(false);
      onEliminado();
    } catch {
      setEliminando(false);
    }
  };

  return (
    <>
      <Paper sx={{ p: 2.5, height: '100%', borderTop: `3px solid ${colorBorde}`, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: alpha(colorBorde || theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icono sx={{ color: colorBorde || 'primary.main', fontSize: 22 }} />
          </Box>
          <StatusBadge estado={doc.estado_documento} />
        </Stack>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={700} sx={{ mb: 0.25 }}>{doc.tipo_documento_nombre}</Typography>
          {doc.fecha_vencimiento ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Vence: {new Date(doc.fecha_vencimiento).toLocaleDateString('es-CO')}
            </Typography>
          ) : (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>Sin fecha de vencimiento</Typography>
          )}
          {dias !== null && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.75 }}>
              {IconoEstado && <IconoEstado sx={{ color: colorIconoEstado, fontSize: 14 }} />}
              <Typography variant="caption" fontWeight={700} sx={{ color: colorIconoEstado }}>
                {dias < 0 ? `Venció hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`
                  : dias === 0 ? 'Vence hoy'
                  : `${dias} día${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`}
              </Typography>
            </Stack>
          )}
          {doc.version > 1 && (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>Versión {doc.version}</Typography>
          )}
        </Box>

        {/* Acción principal: ver archivo, a todo lo ancho */}
        <Stack spacing={0.75} sx={{ mt: 0.5 }}>
          {doc.archivo_url && (
            <Button
              size="small"
              variant="outlined"
              fullWidth
              startIcon={<VisibilityIcon fontSize="small" />}
              component="a"
              href={doc.archivo_url}
              target="_blank"
              rel="noopener"
              sx={{ justifyContent: 'center' }}
            >
              Ver archivo
            </Button>
          )}

          {/* Acciones secundarias: solo íconos con tooltip, alineadas en una fila */}
          {(puedeEditar || puedeEliminar) && (
            <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ pt: 0.25 }}>
              {puedeEditar && (
                <Tooltip title="Renovar documento (subir nueva versión)">
                  <IconButton size="small" onClick={onSubir} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.08) } }}>
                    <UploadFileIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {puedeEditar && (
                <Tooltip title="Notificar renovación por correo">
                  <IconButton size="small" onClick={() => setDialogoNotificar(true)} sx={{ color: 'text.secondary', '&:hover': { color: 'info.main', bgcolor: alpha(theme.palette.info.main, 0.08) } }}>
                    <EmailOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {puedeEliminar && (
                <Tooltip title="Eliminar documento (borrado lógico)">
                  <IconButton size="small" onClick={() => setDialogoEliminar(true)} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.08) } }}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          )}
        </Stack>
      </Paper>

      <NotificarDocumentoDialog
        abierto={dialogoNotificar}
        vehiculo={vehiculo}
        doc={doc}
        onCerrar={() => setDialogoNotificar(false)}
      />

      <Dialog open={dialogoEliminar} onClose={() => setDialogoEliminar(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar documento</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            ¿Confirmas eliminar el documento <strong>{doc.tipo_documento_nombre}</strong> del vehículo{' '}
            <strong>{vehiculo.placa}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            El archivo permanecerá en Google Drive y se conservará el registro para auditoría. Solo desaparecerá
            de esta vista.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogoEliminar(false)} disabled={eliminando}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={confirmarEliminar} disabled={eliminando}>
            {eliminando ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function VehiculoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { usuario } = useAuth();
  const { catalogos } = useCatalogos();
  const theme = useTheme();
  const vehiculoId = Number(params.id);

  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [historial, setHistorial] = useState<HistorialCambio[]>([]);
  const [alertasVehiculo, setAlertasVehiculo] = useState<Alerta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogoEditar, setDialogoEditar] = useState(false);
  const [dialogoSubir, setDialogoSubir] = useState(false);

  const cargar = useCallback(() => {
    setCargando(true); setError(null);
    Promise.all([
      vehiculosService.obtener(vehiculoId),
      documentosService.listarPorVehiculo(vehiculoId),
      vehiculosService.historial(vehiculoId),
      alertasService.listar(false),
    ])
      .then(([v, docs, hist, todasLasAlertas]) => {
        setVehiculo(v); setDocumentos(docs || []); setHistorial(hist || []);
        setAlertasVehiculo((todasLasAlertas || []).filter((a) => a.vehiculo_id === vehiculoId));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudo cargar el vehículo'))
      .finally(() => setCargando(false));
  }, [vehiculoId]);

  useEffect(() => { if (vehiculoId) cargar(); }, [vehiculoId, cargar]);

  const puedeEditar = usuario && ROLES_PUEDEN_EDITAR.includes(usuario.rol_nombre);
  const puedeEliminar = usuario && usuario.rol_nombre === 'Administrador';

  return (
    <AppShell titulo={vehiculo ? `Vehículo ${vehiculo.placa}` : 'Vehículo'}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/vehiculos')} sx={{ mb: 2 }} size="small">
        Volver a vehículos
      </Button>

      {cargando && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error">{error}</Alert>}

      {vehiculo && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
              <Box sx={{ width: 88, height: 72, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.08), border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DirectionsCarIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                      <Typography variant="h5" fontWeight={800} sx={{ fontFamily: 'monospace', letterSpacing: '0.06em', color: 'primary.main' }}>{vehiculo.placa}</Typography>
                      <StatusBadge estado={vehiculo.estado_nombre || ''} />
                      {vehiculo.tipo_vehiculo_nombre && <Chip label={vehiculo.tipo_vehiculo_nombre} size="small" variant="outlined" sx={{ fontSize: '0.72rem' }} />}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {[vehiculo.marca, vehiculo.linea, vehiculo.modelo ? `· ${vehiculo.modelo}` : ''].filter(Boolean).join(' ')}
                    </Typography>
                  </Box>
                  {puedeEditar && <Button startIcon={<EditIcon />} onClick={() => setDialogoEditar(true)} size="small" variant="outlined">Editar</Button>}
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Grid container spacing={1.5}>
                  <CampoInfo label="Color" valor={vehiculo.color} />
                  <CampoInfo label="Combustible" valor={vehiculo.combustible} />
                  <CampoInfo label="Dependencia" valor={vehiculo.dependencia_nombre} />
                  <CampoInfo label="Responsable" valor={vehiculo.responsable_nombre} />
                  <CampoInfo label="Ubicación" valor={vehiculo.ubicacion} />
                  {vehiculo.observaciones && <CampoInfo label="Observaciones" valor={vehiculo.observaciones} ancho={12} />}
                </Grid>
              </Box>
            </Stack>
          </Paper>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Documentos del vehículo</Typography>
              <Typography variant="caption" color="text.secondary">
                {documentos.length} documento{documentos.length !== 1 ? 's' : ''} registrado{documentos.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            {puedeEditar && <Button size="small" variant="contained" startIcon={<UploadFileIcon />} onClick={() => setDialogoSubir(true)}>Subir documento</Button>}
          </Stack>

          {documentos.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: 'center', mb: 3 }}>
              <DescriptionOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={500}>Este vehículo todavía no tiene documentos cargados.</Typography>
              {puedeEditar && <Button size="small" sx={{ mt: 1.5 }} onClick={() => setDialogoSubir(true)} startIcon={<UploadFileIcon />}>Cargar primer documento</Button>}
            </Paper>
          ) : (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {documentos.map((doc) => (
                <Grid item xs={12} sm={6} md={3} key={doc.id}>
                  <DocumentoCard
                    doc={doc}
                    vehiculo={vehiculo}
                    puedeEditar={!!puedeEditar}
                    puedeEliminar={!!puedeEliminar}
                    onSubir={() => setDialogoSubir(true)}
                    onEliminado={cargar}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Historial de eventos</Typography>
            <HistorialTimeline eventos={historial} alertas={alertasVehiculo} />
          </Paper>
        </>
      )}

      <VehiculoFormDialog abierto={dialogoEditar} vehiculo={vehiculo} onCerrar={() => setDialogoEditar(false)} onGuardado={() => { setDialogoEditar(false); cargar(); }} />
      <DocumentoUploadDialog abierto={dialogoSubir} vehiculoId={vehiculoId} tiposDocumento={catalogos?.tipos_documento || []} onCerrar={() => setDialogoSubir(false)} onSubido={() => { setDialogoSubir(false); cargar(); }} />
    </AppShell>
  );
}

function CampoInfo({ label, valor, ancho = 4 }: { label: string; valor?: string | null; ancho?: number }) {
  return (
    <Grid item xs={12} sm={ancho}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>{valor || '—'}</Typography>
    </Grid>
  );
}
