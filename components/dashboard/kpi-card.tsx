'use client';

import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

interface Props {
  titulo: string;
  valor: number | string;
  iconePersonalizado?: ReactNode;
  icono?: unknown; // compatibilidad hacia atrás
  color?: string;        // color base (se usa para calcular el gradiente suave)
  colorFin?: string;     // extremo del gradiente (opcional, si no se calcula auto)
  subtitulo?: string;
  miniChart?: unknown;   // ya no se usa, se mantiene por compatibilidad
  /** URL de destino al hacer clic en la tarjeta (con query params si aplica) */
  href?: string;
}

export default function KpiCard({
  titulo,
  valor,
  iconePersonalizado,
  color = '#6B9FFF',
  colorFin,
  subtitulo,
  href,
}: Props) {
  const router = useRouter();
  const gradEnd = colorFin || color;
  const esClickable = !!href;

  return (
    <Box
      onClick={esClickable ? () => router.push(href!) : undefined}
      sx={{
        height: '100%',
        minHeight: 90,
        borderRadius: '16px',
        background: `linear-gradient(135deg, ${color} 0%, ${gradEnd} 100%)`,
        boxShadow: '0 4px 18px rgba(0,0,0,0.10)',
        px: 2.5,
        py: 2,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        cursor: esClickable ? 'pointer' : 'default',
        '&:hover': esClickable ? {
          transform: 'translateY(-3px)',
          boxShadow: '0 10px 28px rgba(0,0,0,0.20)',
        } : {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        },
      }}
    >
      {/* Ícono en círculo semitransparente */}
      {iconePersonalizado && (
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.22)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {iconePersonalizado}
        </Box>
      )}

      {/* Texto */}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.45rem',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
        >
          {valor}
        </Typography>
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.82)',
            fontWeight: 500,
            fontSize: '0.72rem',
            mt: 0.35,
            letterSpacing: '0.01em',
            display: 'block',
          }}
        >
          {titulo}
        </Typography>
        {subtitulo && (
          <Typography
            sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', display: 'block', mt: 0.2 }}
          >
            {subtitulo}
          </Typography>
        )}
      </Box>
      {/* Indicador de navegación */}
      {esClickable && (
        <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem', flexShrink: 0, userSelect: 'none' }}>
          →
        </Typography>
      )}
    </Box>
  );
}
