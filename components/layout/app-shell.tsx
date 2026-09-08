'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Toolbar, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { useAuth } from '@/contexts/auth-context';
import Sidebar, { ANCHO_SIDEBAR } from './sidebar';
import Topbar from './topbar';

export default function AppShell({ titulo, children }: { titulo: string; children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const esMovil = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerAbierto, setDrawerAbierto] = useState(false);

  useEffect(() => {
    if (!cargando && !usuario) {
      router.replace('/login');
    }
  }, [cargando, usuario, router]);

  // Si la ventana pasa a tamaño de escritorio, el drawer "temporal" de móvil
  // no debe quedar abierto por detrás del permanente.
  useEffect(() => {
    if (!esMovil) setDrawerAbierto(false);
  }, [esMovil]);

  if (cargando || !usuario) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar movil={esMovil} abierto={drawerAbierto} onCerrar={() => setDrawerAbierto(false)} />
      <Topbar titulo={titulo} mostrarBotonMenu={esMovil} onAbrirMenu={() => setDrawerAbierto(true)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${ANCHO_SIDEBAR}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>
      </Box>
    </Box>
  );
}
