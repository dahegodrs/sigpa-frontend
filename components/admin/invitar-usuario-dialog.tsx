'use client';

import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid, Alert } from '@mui/material';
import { usuariosService } from '@/lib/services';
import { ApiError } from '@/lib/api-client';
import type { Catalogos, Dependencia } from '@/types';

interface Props {
  abierto: boolean;
  catalogos: Catalogos | null;
  dependencias: Dependencia[];
  onCerrar: () => void;
  onCreado: () => void;
}

export default function InvitarUsuarioDialog({ abierto, catalogos, dependencias, onCerrar, onCreado }: Props) {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [rolId, setRolId] = useState<number | ''>('');
  const [dependenciaId, setDependenciaId] = useState<number | ''>('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limpiar = () => {
    setEmail('');
    setNombre('');
    setRolId('');
    setDependenciaId('');
    setError(null);
  };

  const guardar = async () => {
    if (!email.trim() || !nombre.trim() || !rolId) {
      setError('Correo, nombre y rol son obligatorios');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await usuariosService.invitar({
        email: email.trim(),
        nombre: nombre.trim(),
        rol_id: Number(rolId),
        dependencia_id: dependenciaId ? Number(dependenciaId) : null,
      });
      limpiar();
      onCreado();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo invitar al usuario');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog
      open={abierto}
      onClose={() => {
        limpiar();
        onCerrar();
      }}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Nuevo usuario</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
          <Grid item xs={12}>
            <Alert severity="info" sx={{ fontSize: 12 }}>
              La persona podrá iniciar sesión con su cuenta corporativa de Google usando este correo;
              el rol y la dependencia ya quedan asignados desde ahora.
            </Alert>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Correo institucional"
              type="email"
              fullWidth
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Nombre completo" fullWidth size="small" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </Grid>
          <Grid item xs={12}>
            <TextField select label="Rol" fullWidth size="small" value={rolId} onChange={(e) => setRolId(Number(e.target.value))} required>
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
        <Button
          onClick={() => {
            limpiar();
            onCerrar();
          }}
          disabled={guardando}
        >
          Cancelar
        </Button>
        <Button variant="contained" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Invitar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
