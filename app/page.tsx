'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '@/contexts/auth-context';

export default function Home() {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;
    router.replace(usuario ? '/dashboard' : '/login');
  }, [cargando, usuario, router]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <CircularProgress color="primary" />
    </Box>
  );
}
