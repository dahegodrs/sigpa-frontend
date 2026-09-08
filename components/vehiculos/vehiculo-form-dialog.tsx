'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useCatalogos } from '@/lib/hooks/use-catalogos';
import { vehiculosService } from '@/lib/services';
import { ApiError } from '@/lib/api-client';
import type { Vehiculo } from '@/types';

interface Props {
  abierto: boolean;
  vehiculo?: Vehiculo | null; // si viene, es edición; si no, es creación
  onCerrar: () => void;
  onGuardado: () => void;
}

type FormState = {
  placa: string;
  tipo_vehiculo_id: number | '';
  marca: string;
  linea: string;
  modelo: string;
  color: string;
  combustible: string;
  dependencia_id: number | '';
  estado_id: number | '';
  ubicacion: string;
  observaciones: string;
  motivo: string;
};

const ESTADO_INICIAL: FormState = {
  placa: '',
  tipo_vehiculo_id: '',
  marca: '',
  linea: '',
  modelo: '',
  color: '',
  combustible: '',
  dependencia_id: '',
  estado_id: '',
  ubicacion: '',
  observaciones: '',
  motivo: '',
};

export default function VehiculoFormDialog({ abierto, vehiculo, onCerrar, onGuardado }: Props) {
  const { catalogos, dependencias, cargando: cargandoCatalogos } = useCatalogos();
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esEdicion = Boolean(vehiculo);

  useEffect(() => {
    if (!abierto) return;
    if (vehiculo) {
      setForm({
        placa: vehiculo.placa,
        tipo_vehiculo_id: vehiculo.tipo_vehiculo_id,
        marca: vehiculo.marca || '',
        linea: vehiculo.linea || '',
        modelo: vehiculo.modelo ? String(vehiculo.modelo) : '',
        color: vehiculo.color || '',
        combustible: vehiculo.combustible || '',
        dependencia_id: vehiculo.dependencia_id || '',
        estado_id: vehiculo.estado_id,
        ubicacion: vehiculo.ubicacion || '',
        observaciones: vehiculo.observaciones || '',
        motivo: '',
      });
    } else {
      setForm(ESTADO_INICIAL);
    }
    setError(null);
  }, [abierto, vehiculo]);

  const actualizarCampo = (campo: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));
  };

  const guardar = async () => {
    setError(null);

    if (!esEdicion && !form.placa.trim()) {
      setError('La placa es obligatoria');
      return;
    }
    if (!form.tipo_vehiculo_id || !form.estado_id) {
      setError('Tipo de vehículo y estado son obligatorios');
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        ...(esEdicion ? {} : { placa: form.placa.trim().toUpperCase() }),
        tipo_vehiculo_id: Number(form.tipo_vehiculo_id),
        marca: form.marca || undefined,
        linea: form.linea || undefined,
        modelo: form.modelo ? Number(form.modelo) : undefined,
        color: form.color || undefined,
        combustible: form.combustible || undefined,
        dependencia_id: form.dependencia_id ? Number(form.dependencia_id) : undefined,
        estado_id: Number(form.estado_id),
        ubicacion: form.ubicacion || undefined,
        observaciones: form.observaciones || undefined,
        ...(esEdicion ? { motivo: form.motivo || 'Actualización desde el panel' } : {}),
      };

      if (esEdicion && vehiculo) {
        await vehiculosService.actualizar(vehiculo.id, payload);
      } else {
        await vehiculosService.crear(payload);
      }
      onGuardado();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el vehículo');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="sm" fullWidth>
      <DialogTitle>{esEdicion ? `Editar ${vehiculo?.placa}` : 'Nuevo vehículo'}</DialogTitle>
      <DialogContent>
        {cargandoCatalogos ? (
          <CircularProgress size={24} sx={{ my: 2 }} />
        ) : (
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            <Grid item xs={6}>
              <TextField
                label="Placa"
                fullWidth
                size="small"
                value={form.placa}
                onChange={actualizarCampo('placa')}
                disabled={esEdicion}
                required={!esEdicion}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                label="Tipo de vehículo"
                fullWidth
                size="small"
                value={form.tipo_vehiculo_id}
                onChange={actualizarCampo('tipo_vehiculo_id')}
                required
              >
                {catalogos?.tipos_vehiculo.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <TextField label="Marca" fullWidth size="small" value={form.marca} onChange={actualizarCampo('marca')} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Línea" fullWidth size="small" value={form.linea} onChange={actualizarCampo('linea')} />
            </Grid>

            <Grid item xs={4}>
              <TextField
                label="Modelo (año)"
                fullWidth
                size="small"
                type="number"
                value={form.modelo}
                onChange={actualizarCampo('modelo')}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Color" fullWidth size="small" value={form.color} onChange={actualizarCampo('color')} />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Combustible"
                fullWidth
                size="small"
                value={form.combustible}
                onChange={actualizarCampo('combustible')}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                select
                label="Dependencia"
                fullWidth
                size="small"
                value={form.dependencia_id}
                onChange={actualizarCampo('dependencia_id')}
              >
                <MenuItem value="">Sin asignar</MenuItem>
                {dependencias.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                label="Estado"
                fullWidth
                size="small"
                value={form.estado_id}
                onChange={actualizarCampo('estado_id')}
                required
              >
                {catalogos?.estados_vehiculo.map((e) => (
                  <MenuItem key={e.id} value={e.id}>
                    {e.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Ubicación"
                fullWidth
                size="small"
                value={form.ubicacion}
                onChange={actualizarCampo('ubicacion')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Observaciones"
                fullWidth
                size="small"
                multiline
                minRows={2}
                value={form.observaciones}
                onChange={actualizarCampo('observaciones')}
              />
            </Grid>

            {esEdicion && (
              <Grid item xs={12}>
                <TextField
                  label="Motivo del cambio (para el historial)"
                  fullWidth
                  size="small"
                  value={form.motivo}
                  onChange={actualizarCampo('motivo')}
                  placeholder="Ej: Cambio de estado por mantenimiento programado"
                />
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={guardar} disabled={guardando || cargandoCatalogos}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
