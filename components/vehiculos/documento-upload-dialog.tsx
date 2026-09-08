'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFileOutlined';
import { documentosService } from '@/lib/services';
import { ApiError } from '@/lib/api-client';
import type { TipoDocumentoCatalogo } from '@/types';

interface Props {
  abierto: boolean;
  vehiculoId: number;
  tiposDocumento: TipoDocumentoCatalogo[];
  onCerrar: () => void;
  onSubido: () => void;
}

export default function DocumentoUploadDialog({ abierto, vehiculoId, tiposDocumento, onCerrar, onSubido }: Props) {
  const [tipoDocumentoId, setTipoDocumentoId] = useState<number | ''>('');
  const [fechaExpedicion, setFechaExpedicion] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limpiar = () => {
    setTipoDocumentoId('');
    setFechaExpedicion('');
    setFechaVencimiento('');
    setObservaciones('');
    setArchivo(null);
    setError(null);
  };

  const cerrar = () => {
    limpiar();
    onCerrar();
  };

  const subir = async () => {
    setError(null);
    if (!tipoDocumentoId) {
      setError('Selecciona el tipo de documento');
      return;
    }
    if (!archivo) {
      setError('Selecciona el archivo a subir');
      return;
    }

    const form = new FormData();
    form.append('tipo_documento_id', String(tipoDocumentoId));
    if (fechaExpedicion) form.append('fecha_expedicion', fechaExpedicion);
    if (fechaVencimiento) form.append('fecha_vencimiento', fechaVencimiento);
    if (observaciones) form.append('observaciones', observaciones);
    form.append('archivo', archivo);

    setSubiendo(true);
    try {
      await documentosService.subir(vehiculoId, form);
      limpiar();
      onSubido();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo subir el documento');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <Dialog open={abierto} onClose={cerrar} maxWidth="xs" fullWidth>
      <DialogTitle>Subir documento</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              select
              label="Tipo de documento"
              fullWidth
              size="small"
              value={tipoDocumentoId}
              onChange={(e) => setTipoDocumentoId(Number(e.target.value))}
              required
            >
              {tiposDocumento.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Fecha de vigencia"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={fechaExpedicion}
              onChange={(e) => setFechaExpedicion(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Fecha de vencimiento"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Observaciones"
              fullWidth
              size="small"
              multiline
              minRows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} fullWidth>
              {archivo ? archivo.name : 'Seleccionar archivo'}
              <input
                type="file"
                hidden
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </Button>
            {archivo && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {(archivo.size / 1024).toFixed(0)} KB
              </Typography>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={cerrar} disabled={subiendo}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={subir} disabled={subiendo}>
          {subiendo ? 'Subiendo…' : 'Subir'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
