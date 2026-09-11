'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Switch,
  Chip,
  Stack,
  TextField,
  Grid,
  Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/GroupOutlined';
import BusinessIcon from '@mui/icons-material/BusinessOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import { useTheme, alpha } from '@mui/material/styles';
import AppShell from '@/components/layout/app-shell';
import UsuarioRolDialog from '@/components/admin/usuario-rol-dialog';
import DependenciaDialog from '@/components/admin/dependencia-dialog';
import InvitarUsuarioDialog from '@/components/admin/invitar-usuario-dialog';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useCatalogos } from '@/lib/hooks/use-catalogos';
import { usuariosService, dependenciasService, vehiculosService, listasService, tiposVehiculoService } from '@/lib/services';
import type { ListaConfiguracion, TipoVehiculoCatalogo } from '@/types';
import { ApiError } from '@/lib/api-client';
import type { Usuario, Dependencia } from '@/types';

export default function AdminPage() {
  const [tab, setTab] = useState(0);

  return (
    <AppShell titulo="Administración">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Administración</Typography>
        <Typography variant="body2" color="text.secondary">Gestión de usuarios, roles y dependencias</Typography>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 1 }}>
          <Tab icon={<PeopleOutlinedIcon fontSize="small" />} iconPosition="start" label="Usuarios" />
          <Tab icon={<SecurityOutlinedIcon fontSize="small" />} iconPosition="start" label="Roles" />
          <Tab icon={<AccountTreeOutlinedIcon fontSize="small" />} iconPosition="start" label="Dependencias" />
          <Tab icon={<ListAltOutlinedIcon fontSize="small" />} iconPosition="start" label="Listas" />
        </Tabs>
      </Paper>

      {tab === 0 && <TabUsuarios />}
      {tab === 1 && <TabRoles />}
      {tab === 2 && <TabDependencias />}
      {tab === 3 && <TabListas />}
    </AppShell>
  );
}

function TabUsuarios() {
  const { catalogos, dependencias } = useCatalogos();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);
  const [dialogoRolAbierto, setDialogoRolAbierto] = useState(false);
  const [dialogoInvitarAbierto, setDialogoInvitarAbierto] = useState(false);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    usuariosService
      .listar()
      .then((res) => setUsuarios(res || []))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los usuarios'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiarActivo = async (u: Usuario) => {
    try {
      await usuariosService.actualizarActivo(u.id, !u.activo);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cambiar el estado del usuario');
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const q = busqueda.toLowerCase();
    return !q || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.rol_nombre.toLowerCase().includes(q);
  });

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Buscar usuario…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
          sx={{ maxWidth: 320 }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogoInvitarAbierto(true)}>
          Nuevo usuario
        </Button>
      </Stack>

      <Paper>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Correo</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Último acceso</TableCell>
                  <TableCell>Activo</TableCell>
                  <TableCell align="right">Editar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuariosFiltrados.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main' }}>
                          {u.nombre
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </Avatar>
                        <Typography variant="body2">{u.nombre}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Chip label={u.rol_nombre} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {u.ultimo_login ? new Date(u.ultimo_login).toLocaleDateString('es-CO') : 'Nunca'}
                    </TableCell>
                    <TableCell>
                      <Switch checked={u.activo} onChange={() => cambiarActivo(u)} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setUsuarioEditar(u);
                          setDialogoRolAbierto(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {usuariosFiltrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                        No hay usuarios que coincidan con la búsqueda.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      <UsuarioRolDialog
        abierto={dialogoRolAbierto}
        usuario={usuarioEditar}
        catalogos={catalogos}
        dependencias={dependencias}
        onCerrar={() => setDialogoRolAbierto(false)}
        onGuardado={() => {
          setDialogoRolAbierto(false);
          cargar();
        }}
      />

      <InvitarUsuarioDialog
        abierto={dialogoInvitarAbierto}
        catalogos={catalogos}
        dependencias={dependencias}
        onCerrar={() => setDialogoInvitarAbierto(false)}
        onCreado={() => {
          setDialogoInvitarAbierto(false);
          cargar();
        }}
      />
    </Box>
  );
}

const COLOR_ROL: Record<string, string> = {
  Administrador: '#DA151C',
  Dependencia: '#16A34A',
  Consulta: '#6B7280',
  Gerencia: '#2563EB',
};

function TabRoles() {
  const { catalogos } = useCatalogos();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    usuariosService
      .listar()
      .then((res) => setUsuarios(res || []))
      .finally(() => setCargando(false));
  }, []);

  const conteoPorRol = new Map<number, number>();
  usuarios.forEach((u) => conteoPorRol.set(u.rol_id, (conteoPorRol.get(u.rol_id) || 0) + 1));

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {catalogos?.roles.map((r) => (
        <Grid item xs={12} sm={6} key={r.id}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: `${COLOR_ROL[r.nombre] || '#757575'}1A`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <GroupIcon sx={{ color: COLOR_ROL[r.nombre] || '#757575' }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {r.nombre}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {r.descripcion}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {conteoPorRol.get(r.id) || 0} usuario(s) asignado(s)
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

function TabDependencias() {
  const theme = useTheme();
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [conteoVehiculos, setConteoVehiculos] = useState<Record<number, number>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dependenciaEditar, setDependenciaEditar] = useState<Dependencia | null>(null);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [dependenciaEliminar, setDependenciaEliminar] = useState<Dependencia | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    Promise.all([dependenciasService.listar(), vehiculosService.listar({ page_size: 200 })])
      .then(([listaDependencias, vehiculosRes]) => {
        setDependencias(listaDependencias || []);
        const conteo: Record<number, number> = {};
        (vehiculosRes.data || []).forEach((v) => {
          if (v.dependencia_id) conteo[v.dependencia_id] = (conteo[v.dependencia_id] || 0) + 1;
        });
        setConteoVehiculos(conteo);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las dependencias'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const confirmarEliminar = async () => {
    if (!dependenciaEliminar) return;
    // Borrado lógico en el backend (activo = FALSE) — la dependencia deja
    // de listarse y de ofrecerse en combos, pero se conserva en la base de
    // datos para no romper vehículos o históricos que ya la referencian.
    setEliminando(true);
    setError(null);
    try {
      await dependenciasService.eliminar(dependenciaEliminar.id);
      setDependenciaEliminar(null);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar la dependencia');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <Paper>
      <Stack direction="row" justifyContent="flex-end" sx={{ p: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setDependenciaEditar(null);
            setDialogoAbierto(true);
          }}
        >
          Nueva dependencia
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      {cargando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : dependencias.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">Todavía no hay dependencias registradas.</Typography>
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell>Dependencia</TableCell>
                <TableCell align="center">Vehículos</TableCell>
                  <TableCell>Responsable</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dependencias.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 30,
                            height: 30,
                            borderRadius: 1.5,
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <BusinessIcon fontSize="small" sx={{ color: 'primary.main' }} />
                        </Box>
                        <Typography variant="body2" fontWeight={600}>
                          {d.nombre}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={700}>
                        {conteoVehiculos[d.id] || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>{d.responsable_nombre || '—'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setDependenciaEditar(d);
                          setDialogoAbierto(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{ color: 'error.main' }}
                        onClick={() => setDependenciaEliminar(d)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Box>
      )}

      <DependenciaDialog
        abierto={dialogoAbierto}
        dependencia={dependenciaEditar}
        onCerrar={() => setDialogoAbierto(false)}
        onGuardado={() => {
          setDialogoAbierto(false);
          cargar();
        }}
      />

      <ConfirmDialog
        abierto={!!dependenciaEliminar}
        titulo="Eliminar dependencia"
        mensaje={`¿Eliminar la dependencia "${dependenciaEliminar?.nombre}"? Esta acción no se puede deshacer desde la interfaz.`}
        cargando={eliminando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setDependenciaEliminar(null)}
      />
    </Paper>
  );
}

// ── Tipos de lista disponibles ────────────────────────────────────────────
// "tipo_vehiculo" es un caso especial: no vive en la tabla listas_configurables
// (esa tabla es genérica para conductores/actividades/etc.), sino en la tabla
// real tipos_vehiculo, porque los vehículos la referencian con una FK. Por
// eso se maneja con su propio servicio (tiposVehiculoService) en vez de
// listasService, pero comparte la misma UI de selector + tabla para que la
// experiencia sea consistente para el Administrador.
const TIPOS_LISTA = [
  { value: 'conductor', label: '🚗 Conductores' },
  { value: 'actividad', label: '⚡ Actividades' },
  { value: 'patio_vehiculo', label: '🅿️ Vehículos de patio' },
  { value: 'tipo_vehiculo', label: '🚙 Tipos de vehículo' },
];

function TabListas() {
  const theme = useTheme();
  const [tipoSeleccionado, setTipoSeleccionado] = useState('conductor');
  const [items, setItems] = useState<ListaConfiguracion[]>([]);
  const [tiposVehiculo, setTiposVehiculo] = useState<TipoVehiculoCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [itemEditar, setItemEditar] = useState<ListaConfiguracion | null>(null);
  const [tipoVehiculoEditar, setTipoVehiculoEditar] = useState<TipoVehiculoCatalogo | null>(null);
  const [nombreEditar, setNombreEditar] = useState('');

  const esTipoVehiculo = tipoSeleccionado === 'tipo_vehiculo';

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    Promise.all([listasService.listar(), tiposVehiculoService.listarTodos()])
      .then(([listaItems, listaTipos]) => {
        setItems(listaItems || []);
        setTiposVehiculo(listaTipos || []);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las listas'))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const itemsFiltrados = items.filter((i) => i.tipo === tipoSeleccionado);

  const agregar = async () => {
    if (!nuevoNombre.trim()) return;
    setGuardando(true);
    try {
      if (esTipoVehiculo) {
        await tiposVehiculoService.crear(nuevoNombre.trim());
      } else {
        await listasService.crear({ tipo: tipoSeleccionado, nombre: nuevoNombre.trim().toUpperCase(), orden: itemsFiltrados.length });
      }
      setNuevoNombre('');
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo agregar');
    } finally { setGuardando(false); }
  };

  const alternarActivo = async (item: ListaConfiguracion) => {
    try {
      await listasService.actualizar(item.id, { nombre: item.nombre, orden: item.orden, activo: !item.activo });
      cargar();
    } catch (err) { setError(err instanceof ApiError ? err.message : 'No se pudo actualizar'); }
  };

  const alternarActivoTipoVehiculo = async (tv: TipoVehiculoCatalogo) => {
    try {
      await tiposVehiculoService.actualizar(tv.id, tv.nombre, !tv.activo);
      cargar();
    } catch (err) { setError(err instanceof ApiError ? err.message : 'No se pudo actualizar'); }
  };

  const guardarEdicion = async () => {
    if (!nombreEditar.trim()) return;
    setGuardando(true);
    try {
      if (esTipoVehiculo && tipoVehiculoEditar) {
        await tiposVehiculoService.actualizar(tipoVehiculoEditar.id, nombreEditar.trim(), tipoVehiculoEditar.activo ?? true);
        setTipoVehiculoEditar(null);
      } else if (itemEditar) {
        await listasService.actualizar(itemEditar.id, { nombre: nombreEditar.trim().toUpperCase(), orden: itemEditar.orden, activo: itemEditar.activo });
        setItemEditar(null);
      }
      setNombreEditar('');
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar');
    } finally { setGuardando(false); }
  };

  return (
    <Box>
      {/* Selector de tipo */}
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
        {TIPOS_LISTA.map((t) => (
          <Button
            key={t.value}
            variant={tipoSeleccionado === t.value ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setTipoSeleccionado(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper>
        {/* Agregar nuevo */}
        <Stack direction="row" spacing={1.5} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            size="small"
            placeholder={esTipoVehiculo ? 'Nuevo tipo de vehículo…' : `Nuevo ${tipoSeleccionado}…`}
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') agregar(); }}
            sx={{ flex: 1 }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={agregar} disabled={guardando || !nuevoNombre.trim()} size="small">
            Agregar
          </Button>
        </Stack>

        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : esTipoVehiculo ? (
          tiposVehiculo.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No hay tipos de vehículo todavía.</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell align="center">Activo</TableCell>
                  <TableCell align="right">Editar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tiposVehiculo.map((tv) => (
                  <TableRow key={tv.id} hover>
                    <TableCell>
                      {tipoVehiculoEditar?.id === tv.id ? (
                        <Stack direction="row" spacing={1}>
                          <TextField size="small" value={nombreEditar} onChange={(e) => setNombreEditar(e.target.value)} sx={{ flex: 1 }} autoFocus />
                          <Button size="small" variant="contained" onClick={guardarEdicion} disabled={guardando}>Guardar</Button>
                          <Button size="small" onClick={() => { setTipoVehiculoEditar(null); setNombreEditar(''); }}>Cancelar</Button>
                        </Stack>
                      ) : (
                        <Typography variant="body2" fontWeight={tv.activo ? 500 : 400} sx={{ color: tv.activo ? 'text.primary' : 'text.disabled' }}>
                          {tv.nombre}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Switch checked={!!tv.activo} onChange={() => alternarActivoTipoVehiculo(tv)} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => { setTipoVehiculoEditar(tv); setNombreEditar(tv.nombre); }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : itemsFiltrados.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No hay items en esta lista todavía.</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell align="center">Activo</TableCell>
                <TableCell align="right">Editar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itemsFiltrados.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    {itemEditar?.id === item.id ? (
                      <Stack direction="row" spacing={1}>
                        <TextField size="small" value={nombreEditar} onChange={(e) => setNombreEditar(e.target.value)} sx={{ flex: 1 }} autoFocus />
                        <Button size="small" variant="contained" onClick={guardarEdicion} disabled={guardando}>Guardar</Button>
                        <Button size="small" onClick={() => { setItemEditar(null); setNombreEditar(''); }}>Cancelar</Button>
                      </Stack>
                    ) : (
                      <Typography variant="body2" fontWeight={item.activo ? 500 : 400} sx={{ color: item.activo ? 'text.primary' : 'text.disabled' }}>
                        {item.nombre}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Switch checked={item.activo} onChange={() => alternarActivo(item)} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => { setItemEditar(item); setNombreEditar(item.nombre); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}
