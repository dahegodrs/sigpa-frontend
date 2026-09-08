'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Box, Typography, Alert, CircularProgress, Stack } from '@mui/material';
import { keyframes } from '@emotion/react';
import { useAuth } from '@/contexts/auth-context';
import { useTema } from '@/contexts/tema-context';
import { COLORES_POR_DEFECTO } from '@/lib/theme';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const CHECKPOINTS = ['SOAT', 'Tecnomecánica', 'Póliza'];

export default function LoginPage() {
  const { loginConIdToken } = useAuth();
  const { tema } = useTema();
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const botonRef = useRef<HTMLDivElement>(null);

  const colorPrimario = tema?.color_primario || COLORES_POR_DEFECTO.primario;
  const colorPanel = tema?.color_fondo_sidebar || COLORES_POR_DEFECTO.fondoSidebar;
  const tipografia = tema?.tipografia || COLORES_POR_DEFECTO.tipografia;
  const logoUrl = tema?.logo_url;

  const manejarCredencial = async (response: { credential: string }) => {
    setProcesando(true);
    setError(null);
    try {
      await loginConIdToken(response.credential);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
      setProcesando(false);
    }
  };

  const inicializarGoogle = () => {
    if (!window.google || !botonRef.current) return;
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: manejarCredencial,
    });
    window.google.accounts.id.renderButton(botonRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      width: 300,
    });
  };

  useEffect(() => {
    inicializarGoogle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={inicializarGoogle} />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Panel institucional: la ruta documental es el elemento de marca de esta pantalla */}
        <Box
          sx={{
            bgcolor: colorPanel,
            color: '#fff',
            width: { xs: '100%', md: '46%' },
            minHeight: { xs: 260, md: '100vh' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: { xs: 4, md: 7 },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: colorPrimario,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>S</Typography>
              )}
            </Box>
            <Typography sx={{ fontFamily: tipografia, fontWeight: 700, letterSpacing: 0.5 }}>SIGPA</Typography>
          </Stack>

          <Box sx={{ my: { xs: 3, md: 0 } }}>
            <Typography
              variant="h4"
              sx={{ fontFamily: tipografia, fontWeight: 700, lineHeight: 1.15, mb: 2, maxWidth: 380 }}
            >
              Cada vehículo, con sus papeles al día.
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 360 }}>
              SIGPA sigue el rastro documental de todo el parque automotor y avisa antes de que algo venza.
            </Typography>
          </Box>

          <RutaDocumental colorAcento={colorPrimario} />
        </Box>

        {/* Panel de acceso */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            p: 4,
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 340 }}>
            <Typography variant="overline" sx={{ color: colorPrimario, fontWeight: 700, letterSpacing: 1.2 }}>
              Acceso institucional
            </Typography>
            <Typography variant="h5" sx={{ fontFamily: tipografia, fontWeight: 700, mt: 0.5, mb: 1 }}>
              Inicia sesión
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Solo con tu cuenta corporativa de Google de la Alcaldía.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {procesando ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
                <CircularProgress size={22} />
                <Typography variant="body2" color="text.secondary">
                  Verificando tu cuenta…
                </Typography>
              </Box>
            ) : (
              <Box ref={botonRef} />
            )}

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 5 }}>
              Si tu correo no pertenece a una entidad registrada en SIGPA, el acceso será rechazado.
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}

const dibujarRuta = keyframes`
  from { stroke-dashoffset: 420; }
  to { stroke-dashoffset: 0; }
`;

/**
 * Motivo de marca de esta pantalla: una ruta con tres paradas (los
 * documentos que SIGPA controla) que llega hasta el vehículo. No es
 * decoración — encierra literalmente lo que hace el producto.
 */
function RutaDocumental({ colorAcento }: { colorAcento: string }) {
  return (
    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
      <svg width="100%" height="150" viewBox="0 0 380 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 130 C 90 130, 90 90, 150 85 S 230 40, 290 40 S 350 20, 368 20"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="2"
          strokeDasharray="6 8"
          fill="none"
        />
        <Box
          component="path"
          d="M10 130 C 90 130, 90 90, 150 85 S 230 40, 290 40 S 350 20, 368 20"
          stroke={colorAcento}
          strokeWidth="2"
          fill="none"
          sx={{
            strokeDasharray: 420,
            animation: `${dibujarRuta} 1.8s ease-out forwards`,
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        />
        {[
          { x: 10, y: 130 },
          { x: 150, y: 85 },
          { x: 290, y: 40 },
        ].map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill={colorAcento} />
            <circle cx={p.x} cy={p.y} r="9" stroke={colorAcento} strokeWidth="1.5" fill="none" opacity="0.5" />
          </g>
        ))}
        <g transform="translate(348, 4)">
          <rect x="0" y="10" width="32" height="16" rx="4" fill={colorAcento} />
          <circle cx="7" cy="27" r="4" fill="#fff" />
          <circle cx="25" cy="27" r="4" fill="#fff" />
        </g>
      </svg>
      <Stack direction="row" spacing={0} sx={{ mt: -1 }}>
        {CHECKPOINTS.map((label) => (
          <Typography key={label} variant="caption" sx={{ flex: 1, color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>
            {label}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}
