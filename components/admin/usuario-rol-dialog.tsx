'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid, Alert, Divider, Typography } from '@mui/material';
import { usuariosService, authService } from '@/lib/services';
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

  // Contraseña local: permite que un Administrador active el acceso de un
  // usuario sin depender de que inicie sesión con Google (útil para
  // usuarios de prueba o sin cuenta corporativa de Google Workspace).
  const [passwordLocal, setPasswordLocal] = useState('');
  const [asignandoPassword, setAsignandoPassword] = useState(false);
  const [passwordExito, setPasswordExito] = useState(false);

  useEffect(() => {
    if (usuario) {
      setRolId(usuario.rol_id);
      setDependenciaId(usuario.dependencia_id || '');
    }
    setError(null);
    setPasswordLocal('');
    setPasswordExito(false);
  }, [usuario, abierto]);

  const asignarPassword = async () => {
    if (!usuario || passwordLocal.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setAsignandoPassword(true);
    setError(null);
    try {
      await authService.asignarPasswordLocal(usuario.id, passwordLocal);
      setPasswordExito(true);
      setPasswordLocal('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo asignar la contraseña');
    } finally {
      setAsignandoPassword(false);
    }
  };

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

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', fontSize: '0.68rem', display: 'block', mb: 1 }}>
              Acceso con usuario y contraseña
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.78rem' }}>
              Permite que este usuario inicie sesión con correo + contraseña en vez de su cuenta de Google —
              útil si no tiene una cuenta corporativa activa (ej. rol Solicitante de prueba).
            </Typography>
            {passwordExito && (
              <Alert severity="success" sx={{ mb: 1.5, fontSize: '0.8rem' }}>
                Contraseña asignada correctamente. El usuario ya puede iniciar sesión en /login.
              </Alert>
            )}
          </Grid>
          <Grid item xs={12} sm={7}>
            <TextField
              label="Nueva contraseña"
              type="password"
              fullWidth
              size="small"
              value={passwordLocal}
              onChange={(e) => setPasswordLocal(e.target.value)}
              helperText="Mínimo 8 caracteres"
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <Button
              variant="outlined"
              fullWidth
              sx={{ height: '100%' }}
              onClick={asignarPassword}
              disabled={asignandoPassword || passwordLocal.length < 8}
            >
              {asignandoPassword ? 'Asignando…' : 'Asignar'}
            </Button>
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
