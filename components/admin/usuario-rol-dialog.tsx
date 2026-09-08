'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid, Alert } from '@mui/material';
import { usuariosService } from '@/lib/services';
import { ApiError } from '@/lib/api-client';
import type { Usuario, Dependencia, Catalogos } from '@/types';

interface Props {
  abierto: boolean;
  usuario: Usuario | null;
  catalogos: Catalogos | null;
  dependencias: Dependencia[];
  onCerrar: () => void;
  onGuardado: () => void;
}

export default function UsuarioRolDialog({ abierto, usuario, catalogos, dependencias, onCerrar, onGuardado }: Props) {
  const [rolId, setRolId] = useState<number | ''>('');
  const [dependenciaId, setDependenciaId] = useState<number | ''>('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (usuario) {
      setRolId(usuario.rol_id);
      setDependenciaId(usuario.dependencia_id || '');
    }
    setError(null);
  }, [usuario, abierto]);

  const guardar = async () => {
    if (!usuario || !rolId) return;
    setGuardando(true);
    setError(null);
    try {
      await usuariosService.actualizarRol(usuario.id, Number(rolId), dependenciaId ? Number(dependenciaId) : null);
      onGuardado();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar el usuario');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={abierto} onClose={onCerrar} maxWidth="xs" fullWidth>
      <DialogTitle>{usuario ? `Editar acceso — ${usuario.nombre}` : 'Editar acceso'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
          <Grid item xs={12}>
            <TextField select label="Rol" fullWidth size="small" value={rolId} onChange={(e) => setRolId(Number(e.target.value))}>
              {catalogos?.roles.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              select
              label="Dependencia (si aplica)"
              fullWidth
              size="small"
              value={dependenciaId}
              onChange={(e) => setDependenciaId(e.target.value ? Number(e.target.value) : '')}
            >
              <MenuItem value="">Sin asignar</MenuItem>
              {dependencias.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.nombre}
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
