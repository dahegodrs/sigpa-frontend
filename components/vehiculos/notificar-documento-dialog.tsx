'use client';

import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Stack, Box, Alert,
  Chip, Divider, Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/SendOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import IconButton from '@mui/material/IconButton';
import { documentosService } from '@/lib/services';
import {
  cargarPlantilla, guardarPlantilla, resetearPlantilla,
  aplicarVariables, VARIABLES_DISPONIBLES, PLANTILLA_POR_DEFECTO,
  type PlantillaCorreo,
} from '@/lib/plantillas-correo';
import type { Documento, Vehiculo } from '@/types';

const REMITENTE = 'Patio@funza-cundinamarca.gov.co';

interface Props {
  abierto: boolean;
  vehiculo: Vehiculo;
  doc: Documento;
  onCerrar: () => void;
}

function buildVars(vehiculo: Vehiculo, doc: Documento) {
  return {
    placa: vehiculo.placa,
    tipo_documento: doc.tipo_documento_nombre || '',
    fecha_vencimiento: doc.fecha_vencimiento
      ? new Date(doc.fecha_vencimiento).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'sin fecha registrada',
    dependencia: vehiculo.dependencia_nombre || 'la dependencia responsable',
    responsable: vehiculo.responsable_nombre || 'el funcionario responsable',
    estado: doc.estado_documento === 'Vencido' ? 'VENCIDO' : 'próximo a vencer',
  };
}

export default function NotificarDocumentoDialog({ abierto, vehiculo, doc, onCerrar }: Props) {
  const theme = useTheme();
  const estaVencido = doc.estado_documento === 'Vencido';
  const colorEstado = estaVencido ? theme.palette.error.main : '#F59E0B';

  const [modo, setModo] = useState<'enviar' | 'editar_plantilla'>('enviar');
  const [destinatario, setDestinatario] = useState('');
  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null);

  // Estado del editor de plantilla
  const [plantillaAsunto, setPlantillaAsunto] = useState('');
  const [plantillaCuerpo, setPlantillaCuerpo] = useState('');

  useEffect(() => {
    if (abierto) {
      const plantilla = cargarPlantilla();
      const vars = buildVars(vehiculo, doc);
      setAsunto(aplicarVariables(plantilla.asunto, vars));
      setCuerpo(aplicarVariables(plantilla.cuerpo, vars));
      setDestinatario('');
      setResultado(null);
      setModo('enviar');
      // Cargar plantilla en el editor también
      setPlantillaAsunto(plantilla.asunto);
      setPlantillaCuerpo(plantilla.cuerpo);
    }
  }, [abierto, vehiculo, doc]);

  const guardar = () => {
    const nueva: PlantillaCorreo = { asunto: plantillaAsunto, cuerpo: plantillaCuerpo };
    guardarPlantilla(nueva);
    // Aplicar las variables al texto guardado para el modo envío
    const vars = buildVars(vehiculo, doc);
    setAsunto(aplicarVariables(plantillaAsunto, vars));
    setCuerpo(aplicarVariables(plantillaCuerpo, vars));
    setModo('enviar');
  };

  const resetear = () => {
    resetearPlantilla();
    setPlantillaAsunto(PLANTILLA_POR_DEFECTO.asunto);
    setPlantillaCuerpo(PLANTILLA_POR_DEFECTO.cuerpo);
  };

  const enviar = async () => {
    if (!destinatario.trim()) return;
    setEnviando(true);
    setResultado(null);
    try {
      await documentosService.notificar(vehiculo.id, {
        tipo_documento: doc.tipo_documento_nombre || '',
        fecha_vencimiento: doc.fecha_vencimiento
          ? new Date(doc.fecha_vencimiento).toLocaleDateString('es-CO')
          : '',
        destinatario_extra: destinatario.trim(),
        asunto,
        cuerpo,
      });
      setResultado({ ok: true, msg: `✓ Correo enviado a ${destinatario.trim()} desde ${REMITENTE}` });
    } catch {
      setResultado({ ok: false, msg: 'No se pudo enviar el correo. Verifica la configuración SMTP.' });
    } finally {
      setEnviando(false);
    }
  };

  const titulo = modo === 'enviar' ? 'Notificar renovación' : 'Editar plantilla de correo';
  const subtitulo = modo === 'enviar'
    ? `${doc.tipo_documento_nombre} — ${vehiculo.placa}`
    : 'Los cambios se guardan para todos los correos futuros';

  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      {/* Header */}
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{
          px: 3, py: 2,
          background: modo === 'editar_plantilla'
            ? `linear-gradient(135deg, #6B7280 0%, #4B5563 100%)`
            : `linear-gradient(135deg, ${colorEstado} 0%, ${alpha(colorEstado, 0.75)} 100%)`,
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {modo === 'editar_plantilla'
              ? <SettingsOutlinedIcon sx={{ color: '#fff', fontSize: 20 }} />
              : <EmailOutlinedIcon sx={{ color: '#fff', fontSize: 20 }} />}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2 }}>{titulo}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.78)' }}>{subtitulo}</Typography>
          </Box>
          <IconButton size="small" onClick={onCerrar} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, pb: 1 }}>
        {/* ── Modo: Enviar correo ── */}
        {modo === 'enviar' && (
          <Stack spacing={2}>
            {resultado && (
              <Alert severity={resultado.ok ? 'success' : 'error'} onClose={() => setResultado(null)}>
                {resultado.msg}
              </Alert>
            )}

            {/* De: */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                De
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <EmailOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                  {REMITENTE}
                </Typography>
                <Chip label="Cuenta corporativa" size="small" sx={{ ml: 'auto', fontSize: '0.62rem', height: 18 }} />
              </Stack>
            </Box>

            {/* Para: */}
            <TextField
              label="Para (destinatario)"
              placeholder="correo@alcaldiadefunza.gov.co"
              fullWidth
              size="small"
              value={destinatario}
              onChange={(e) => setDestinatario(e.target.value)}
              required
              type="email"
              helperText="Correo institucional del responsable o dependencia"
            />

            <Divider />

            {/* Asunto */}
            <TextField
              label="Asunto"
              fullWidth
              size="small"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
            />

            {/* Cuerpo */}
            <TextField
              label="Mensaje"
              fullWidth
              multiline
              minRows={7}
              maxRows={12}
              size="small"
              value={cuerpo}
              onChange={(e) => setCuerpo(e.target.value)}
              sx={{ '& .MuiInputBase-input': { fontFamily: 'inherit', fontSize: '0.85rem', lineHeight: 1.7 } }}
            />
          </Stack>
        )}

        {/* ── Modo: Editar plantilla ── */}
        {modo === 'editar_plantilla' && (
          <Stack spacing={2}>
            <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
              Usa <strong>{'{{variable}}'}</strong> para insertar datos dinámicos. Las variables se reemplazan automáticamente al abrir el diálogo de envío.
            </Alert>

            {/* Variables disponibles */}
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
                      onClick={() => {
                        // Insertar en el cuerpo (al final) al hacer clic
                        setPlantillaCuerpo((prev) => prev + ' ' + v.clave);
                      }}
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
              value={plantillaAsunto}
              onChange={(e) => setPlantillaAsunto(e.target.value)}
            />

            <TextField
              label="Cuerpo del correo (plantilla)"
              fullWidth
              multiline
              minRows={8}
              maxRows={14}
              size="small"
              value={plantillaCuerpo}
              onChange={(e) => setPlantillaCuerpo(e.target.value)}
              sx={{ '& .MuiInputBase-input': { fontFamily: 'inherit', fontSize: '0.85rem', lineHeight: 1.7 } }}
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {modo === 'enviar' ? (
          <>
            <Tooltip title="Editar la plantilla por defecto del correo">
              <Button
                size="small"
                startIcon={<SettingsOutlinedIcon fontSize="small" />}
                onClick={() => setModo('editar_plantilla')}
                sx={{ color: 'text.secondary', mr: 'auto' }}
              >
                Plantilla
              </Button>
            </Tooltip>
            <Button onClick={onCerrar} size="small" sx={{ color: 'text.secondary' }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<SendIcon />}
              onClick={enviar}
              disabled={enviando || !destinatario.trim() || !!resultado?.ok}
              sx={{ minWidth: 120 }}
            >
              {enviando ? 'Enviando…' : 'Enviar correo'}
            </Button>
          </>
        ) : (
          <>
            <Button size="small" color="error" onClick={resetear} sx={{ mr: 'auto' }}>
              Restablecer por defecto
            </Button>
            <Button onClick={() => setModo('enviar')} size="small" sx={{ color: 'text.secondary' }}>
              Cancelar
            </Button>
            <Button variant="contained" size="small" onClick={guardar}>
              Guardar plantilla
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
