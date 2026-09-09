'use client';

import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { alpha } from '@mui/material/styles';
import type { ReactNode } from 'react';

interface Props {
  titulo: string;
  valor: number | string;
  iconePersonalizado?: ReactNode;
  icono?: unknown; // compatibilidad hacia atrás
  color?: string;        // color del borde izquierdo y del ícono
  colorFin?: string;     // ya no se usa (antes era el extremo del gradiente) — se mantiene por compatibilidad
  subtitulo?: string;
  miniChart?: unknown;   // ya no se usa, se mantiene por compatibilidad
  /** URL de destino al hacer clic en la tarjeta (con query params si aplica) */
  href?: string;
}

/**
 * Tarjeta KPI — estilo "borde izquierdo de color sobre fondo blanco",
 * inspirado en dashboards ejecutivos modernos (Jira/Linear/paneles de
 * gestión de proyectos): fondo blanco limpio, línea de acento a la
 * izquierda que identifica la categoría, ícono en círculo suave del mismo
 * color, y el número en negro para máxima legibilidad — reemplaza el
 * estilo anterior de tarjetas con gradiente de color sólido.
 */
export default function KpiCard({
  titulo,
  valor,
  iconePersonalizado,
  color = '#6B9FFF',
  subtitulo,
  href,
}: Props) {
  const router = useRouter();
  const esClickable = !!href;

  return (
    <Box
      onClick={esClickable ? () => router.push(href!) : undefined}
      sx={{
        height: '100%',
        minHeight: 92,
        borderRadius: '12px',
        bgcolor: '#ffffff',
        borderLeft: `4px solid ${color}`,
        border: '1px solid',
        borderColor: 'divider',
        borderLeftWidth: '4px',
        borderLeftColor: color,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        px: 2,
        py: 1.75,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 1.5,
        transition: 'transform 0.16s ease, box-shadow 0.16s ease',
        cursor: esClickable ? 'pointer' : 'default',
        '&:hover': esClickable ? {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 18px rgba(0,0,0,0.10)',
        } : {},
      }}
    >
      {/* Texto */}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            color: 'text.secondary',
            fontWeight: 700,
            fontSize: '0.66rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            display: 'block',
            mb: 0.75,
          }}
        >
          {titulo}
        </Typography>
        <Typography
          sx={{
            color: '#1a1a1a',
            fontWeight: 800,
            fontSize: '1.6rem',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {valor}
        </Typography>
        {subtitulo && (
          <Typography
            sx={{ color: 'text.disabled', fontSize: '0.68rem', display: 'block', mt: 0.5 }}
          >
            {subtitulo}
          </Typography>
        )}
      </Box>

      {/* Ícono en círculo suave del color de la categoría, con anillo sutil */}
      {iconePersonalizado && (
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            bgcolor: alpha(color, 0.12),
            border: `1px solid ${alpha(color, 0.22)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {iconePersonalizado}
        </Box>
      )}
    </Box>
  );
}
