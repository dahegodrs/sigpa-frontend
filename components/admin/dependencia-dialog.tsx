'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, Alert, MenuItem } from '@mui/material';
import { dependenciasService, usuariosService } from '@/lib/services';
import { ApiError } from '@/lib/api-client';
import type { Dependencia, Usuario } from '@/types';

interface Props {
  abierto: boolean;
  dependencia?: Dependencia | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

export default function DependenciaDialog({ abierto, dependencia, onCerrar, onGuardado }: Props) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [responsableId, setResponsableId] = useState<number | ''>('');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esEdicion = Boolean(dependencia);

  useEffect(() => {
    if (!abierto) return;
    setNombre(dependencia?.nombre || '');
    setDescripcion(dependencia?.descripcion || '');
    setResponsableId(dependencia?.responsable_id || '');
    setError(null);
    usuariosService.listar().then(setUsuarios).catch(() => setUsuarios([]));
  }, [abierto, dependencia]);

  const guardar = async () => {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const payload = { nombre, descripcion, responsable_id: responsableId || null };
      if (esEdicion && dependencia) {
        await dependenciasService.actualizar(dependencia.id, payload);
      } else {
        await dependenciasService.crear(payload);
      }
      onGuardado();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la dependencia');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="xs" fullWidth>
      <DialogTitle>{esEdicion ? 'Editar dependencia' : 'Nueva dependencia'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
          <Grid item xs={12}>
            <TextField label="Nombre" fullWidth size="small" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Descripción"
              fullWidth
              size="small"
              multiline
              minRows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              select
              label="Responsable"
              fullWidth
              size="small"
              value={responsableId}
              onChange={(e) => setResponsableId(e.target.value ? Number(e.target.value) : '')}
            >
              <MenuItem value="">Sin asignar</MenuItem>
              {usuarios.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar} disabled={guardando}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
