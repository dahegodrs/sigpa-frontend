'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Divider, Avatar, Stack,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCarOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import NotificationsIcon from '@mui/icons-material/NotificationsOutlined';
import AssessmentIcon from '@mui/icons-material/AssessmentOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import { useAuth } from '@/contexts/auth-context';
import { useTema } from '@/contexts/tema-context';
import { useModo } from '@/contexts/modo-context';
import { useConteosYOrganizacion } from '@/lib/hooks/use-conteos';
import { COLORES_POR_DEFECTO } from '@/lib/theme';

const ANCHO_SIDEBAR = 240;

const ITEMS_NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: DashboardIcon, roles: ['Administrador', 'Dependencia', 'Consulta', 'Gerencia'], badge: null as 'vehiculos' | 'alertas' | null },
  { label: 'Vehículos', href: '/vehiculos', icon: DirectionsCarIcon, roles: ['Administrador', 'Dependencia', 'Consulta', 'Gerencia'], badge: 'vehiculos' as const },
  { label: 'Documentos', href: '/documentos', icon: DescriptionOutlinedIcon, roles: ['Administrador', 'Dependencia', 'Consulta', 'Gerencia'], badge: null },
  { label: 'Alertas', href: '/alertas', icon: NotificationsIcon, roles: ['Administrador', 'Dependencia', 'Consulta', 'Gerencia'], badge: 'alertas' as const },
  { label: 'Programación', href: '/programaciones', icon: CalendarMonthOutlinedIcon, roles: ['Administrador', 'Dependencia', 'Consulta', 'Gerencia'], badge: null },
  { label: 'Reportes', href: '/reportes', icon: AssessmentIcon, roles: ['Administrador', 'Consulta', 'Gerencia'], badge: null },
  { label: 'Administración', href: '/admin', icon: AdminPanelSettingsIcon, roles: ['Administrador'], badge: null },
  // El rol "Solicitante" es de acceso reducido — solo puede pedir un
  // vehículo y ver el estado de lo que ya pidió, sin ver el resto del
  // sistema (dashboard, flota completa, documentos, etc.).
  { label: 'Solicitar vehículo', href: '/solicitar-vehiculo', icon: AddCircleOutlineIcon, roles: ['Solicitante'], badge: null },
  { label: 'Mis solicitudes', href: '/mis-solicitudes', icon: ListAltOutlinedIcon, roles: ['Solicitante'], badge: null },
];

export default function Sidebar({ movil, abierto, onCerrar }: { movil: boolean; abierto: boolean; onCerrar: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, logout } = useAuth();
  const { tema } = useTema();
  const { totalVehiculos, alertasPendientes, organizacion } = useConteosYOrganizacion();

  const { modo } = useModo();
  const esOscuro = modo === 'dark';
  // En modo oscuro el sidebar debe ser más oscuro que el contenido (#111318)
  // para mantener la jerarquía visual correcta: sidebar oscuro < contenido.
  const colorFondoBase = tema?.color_fondo_sidebar || COLORES_POR_DEFECTO.fondoSidebar;
  const colorFondo = esOscuro ? '#0E1117' : colorFondoBase;
  const colorHover = tema?.color_hover_sidebar || tema?.color_primario || COLORES_POR_DEFECTO.primario;
  const colorPrimario = tema?.color_primario || COLORES_POR_DEFECTO.primario;
  const logoUrl = tema?.logo_url || null;

  const itemsVisibles = ITEMS_NAV.filter((item) => !usuario || item.roles.includes(usuario.rol_nombre));
  const conteoPorBadge: Record<string, number | null> = { vehiculos: totalVehiculos, alertas: alertasPendientes };

  const irA = (href: string) => { router.push(href); if (movil) onCerrar(); };

  const contenido = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
        {logoUrl ? (
          <Box sx={{ width: '100%', maxWidth: 180, bgcolor: '#fff', borderRadius: 1.5, px: 1.5, py: 1, mb: 1 }}>
            <Image src={logoUrl} alt="Logo organización" width={180} height={60} style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'contain' }} />
          </Box>
        ) : (
          <Box sx={{ width: '100%', maxWidth: 180, bgcolor: '#FFFFFF', borderRadius: 1.5, px: 1.5, py: 1, mb: 1 }}>
            <Image src="/logo-funza.png" alt="Alcaldía de Funza" width={984} height={326} priority style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'contain' }} />
          </Box>
        )}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: colorPrimario, flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
            Sistema de Gestión
          </Typography>
        </Stack>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2 }} />

      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', px: 2.5, pt: 2, pb: 0.75, display: 'block', letterSpacing: '0.07em', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }}>
        Menú principal
      </Typography>

      <List sx={{ px: 1.5, flex: 1 }}>
        {itemsVisibles.map((item) => {
          const activo = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          const conteo = item.badge ? conteoPorBadge[item.badge] : null;
          return (
            <ListItemButton
              key={item.href}
              selected={activo}
              onClick={() => irA(item.href)}
              sx={{
                borderRadius: 2, mb: 0.25, px: 1.5, py: 0.9,
                color: activo ? '#fff' : 'rgba(255,255,255,0.65)',
                '&.Mui-selected': { bgcolor: colorHover, '&:hover': { bgcolor: colorHover, filter: 'brightness(1.1)' } },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
                transition: 'all 0.15s ease',
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 34 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: activo ? 600 : 400, lineHeight: 1 }} />
              {conteo !== null && conteo !== undefined && conteo > 0 && (
                <Box sx={{ bgcolor: activo ? 'rgba(255,255,255,0.22)' : colorPrimario, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, px: 0.9, py: 0.15, minWidth: 18, textAlign: 'center', lineHeight: 1.6 }}>
                  {conteo}
                </Box>
              )}
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ width: 30, height: 30, bgcolor: colorPrimario, fontSize: 12, fontWeight: 700 }}>
            {organizacion?.nombre?.[0]?.toUpperCase() || 'A'}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" fontWeight={700} noWrap sx={{ display: 'block', color: '#fff', fontSize: '0.78rem', lineHeight: 1.2 }}>
              {organizacion?.nombre || 'Cargando…'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem' }} noWrap>
              {usuario?.rol_nombre}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2, px: 1.5, py: 1, mb: 1 }}>
          <Typography variant="caption" fontWeight={600} noWrap sx={{ display: 'block', color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem' }}>
            {usuario?.nombre}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem' }} noWrap>
            {usuario?.email}
          </Typography>
        </Box>
        <ListItemButton onClick={logout} sx={{ borderRadius: 2, color: 'rgba(255,255,255,0.55)', py: 0.6, px: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)' } }}>
          <ListItemIcon sx={{ color: 'inherit', minWidth: 30 }}><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: 13 }}>Cerrar sesión</ListItemText>
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={movil ? 'temporary' : 'permanent'}
      open={movil ? abierto : true}
      onClose={onCerrar}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: ANCHO_SIDEBAR,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: ANCHO_SIDEBAR,
          boxSizing: 'border-box',
          bgcolor: colorFondo,
          color: '#fff',
          borderRight: 'none',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        },
      }}
    >
      {contenido}
    </Drawer>
  );
}

export { ANCHO_SIDEBAR };
