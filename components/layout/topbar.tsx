'use client';

import { useState, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBar, Toolbar, Box, Typography, Avatar, Menu, MenuItem,
  IconButton, InputBase, Badge, Stack, Tooltip, Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { useAuth } from '@/contexts/auth-context';
import { useModo } from '@/contexts/modo-context';
import { useConteosYOrganizacion } from '@/lib/hooks/use-conteos';
import { ANCHO_SIDEBAR } from './sidebar';

export default function Topbar({ titulo, mostrarBotonMenu, onAbrirMenu }: { titulo: string; mostrarBotonMenu: boolean; onAbrirMenu: () => void }) {
  const { usuario, logout } = useAuth();
  const { modo, alternarModo } = useModo();
  const { alertasPendientes } = useConteosYOrganizacion();
  const theme = useTheme();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [busqueda, setBusqueda] = useState('');

  const iniciales = usuario?.nombre
    ? usuario.nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const buscar = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && busqueda.trim()) {
      router.push(`/vehiculos?placa=${encodeURIComponent(busqueda.trim())}`);
    }
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { xs: '100%', md: `calc(100% - ${ANCHO_SIDEBAR}px)` },
        ml: { xs: 0, md: `${ANCHO_SIDEBAR}px` },
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, minHeight: 56 }}>
        {/* Izquierda */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
          {mostrarBotonMenu && (
            <IconButton edge="start" onClick={onAbrirMenu} size="small" sx={{ mr: 0.5 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.75 }}>
            <Typography variant="body2" color="text.disabled" sx={{ fontSize: '0.8rem' }}>SIGPA</Typography>
            <Typography color="text.disabled" sx={{ fontSize: '0.8rem' }}>›</Typography>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.9rem', color: 'text.primary' }}>{titulo}</Typography>
          </Box>
          <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ display: { xs: 'block', sm: 'none' } }}>{titulo}</Typography>
        </Stack>

        {/* Centro: búsqueda */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1,
            bgcolor: alpha(theme.palette.text.primary, 0.05),
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '24px',
            px: 2,
            py: 0.6,
            width: 280,
            transition: 'all 0.2s ease',
            '&:focus-within': {
              bgcolor: 'background.paper',
              borderColor: 'primary.main',
              boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`,
              width: 320,
            },
          }}
        >
          <SearchIcon sx={{ color: 'text.disabled', fontSize: 18, flexShrink: 0 }} />
          <InputBase placeholder="Buscar por placa…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} onKeyDown={buscar} sx={{ fontSize: 14, flex: 1, '& input': { p: 0 } }} />
        </Box>

        {/* Derecha */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
          <Tooltip title={modo === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
            <IconButton onClick={alternarModo} size="small" sx={{ color: 'text.secondary' }}>
              {modo === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title={alertasPendientes ? `${alertasPendientes} alertas sin leer` : 'Sin alertas sin leer'}>
            <IconButton size="small" onClick={() => router.push('/alertas')} sx={{ color: 'text.secondary' }}>
              <Badge badgeContent={alertasPendientes || 0} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16, fontWeight: 700 } }}>
                <NotificationsOutlinedIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 24, alignSelf: 'center' }} />

          <Box
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', borderRadius: 2, px: 1, py: 0.5, '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.05) }, transition: 'background 0.15s ease' }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13, fontWeight: 700 }}>{iniciales}</Avatar>
            <Box sx={{ display: { xs: 'none', md: 'block' }, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap sx={{ lineHeight: 1.2, fontSize: '0.82rem' }}>{usuario?.nombre}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>{usuario?.rol_nombre}</Typography>
            </Box>
          </Box>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { mt: 0.5, minWidth: 200, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" fontWeight={700}>{usuario?.nombre}</Typography>
            <Typography variant="caption" color="text.secondary">{usuario?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={logout} sx={{ gap: 1.5, py: 1.25, color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.06) } }}>
            <LogoutIcon fontSize="small" />
            <Typography variant="body2" fontWeight={500}>Cerrar sesión</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
