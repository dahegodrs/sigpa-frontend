'use client';

import { createTheme, Theme, alpha } from '@mui/material/styles';
import type { OrganizacionTema } from '@/types';

export const COLORES_POR_DEFECTO = {
  primario: '#DA151C',
  secundario: '#333333',
  fondoSidebar: '#2C2C2C',
  fondoTopbar: '#FFFFFF',
  botonSecundario: '#E6E6E6',
  texto: '#1A1A1A',
  tipografia: 'Outfit',
};

export function buildTheme(tema?: OrganizacionTema | null, modo: 'light' | 'dark' = 'light'): Theme {
  const c = {
    primario: tema?.color_primario || COLORES_POR_DEFECTO.primario,
    secundario: tema?.color_secundario || COLORES_POR_DEFECTO.secundario,
    fondoSidebar: tema?.color_fondo_sidebar || COLORES_POR_DEFECTO.fondoSidebar,
    hoverSidebar: tema?.color_hover_sidebar || tema?.color_primario || COLORES_POR_DEFECTO.primario,
    fondoTopbar: tema?.color_fondo_topbar || COLORES_POR_DEFECTO.fondoTopbar,
    botonPrimario: tema?.color_boton_primario || tema?.color_primario || COLORES_POR_DEFECTO.primario,
    botonSecundario: tema?.color_boton_secundario || COLORES_POR_DEFECTO.botonSecundario,
    texto: tema?.color_texto || COLORES_POR_DEFECTO.texto,
    tipografia: tema?.tipografia || COLORES_POR_DEFECTO.tipografia,
  };

  const esOscuro = modo === 'dark';

  return createTheme({
    palette: {
      mode: modo,
      primary: { main: c.primario, contrastText: '#FFFFFF' },
      secondary: { main: c.secundario, contrastText: '#FFFFFF' },
      background: {
        // Modo oscuro: usar un gris muy oscuro (no negro puro) para que
        // el sidebar a #1E1E1E no quede más claro que el contenido.
        default: esOscuro ? '#111318' : '#F4F5F7',
        paper:   esOscuro ? '#1C1F26' : '#FFFFFF',
      },
      text: {
        primary:   esOscuro ? '#EAEAEA' : c.texto,
        secondary: esOscuro ? '#B0B0B0' : '#555555',
        disabled:  esOscuro ? '#6B6B6B' : '#999999',
      },
      divider: esOscuro ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)',
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: `"${c.tipografia}", "Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif`,
      h4: { fontWeight: 700, letterSpacing: '-0.015em' },
      h5: { fontWeight: 600, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { fontWeight: 600, letterSpacing: '0.01em' },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: esOscuro ? '#1C1F26' : c.fondoTopbar,
            boxShadow: esOscuro
              ? '0 1px 0 rgba(255,255,255,0.07)'
              : '0 1px 0 rgba(0,0,0,0.06)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
          contained: { boxShadow: 'none', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' } },
          outlined: { borderWidth: '1.5px', '&:hover': { borderWidth: '1.5px' } },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: esOscuro
              ? '0 1px 4px rgba(0,0,0,0.4)'
              : '0 1px 3px rgba(0,0,0,0.07)',
            border: `1px solid ${esOscuro ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          elevation1: {
            boxShadow: esOscuro
              ? '0 1px 4px rgba(0,0,0,0.4)'
              : '0 1px 3px rgba(0,0,0,0.07)',
          },
        },
      },

      // ── Tablas con mejor contraste y zebra stripes ─────────────────────
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 700,
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              // Modo oscuro: texto bien legible
              color: esOscuro ? '#C8C8C8' : '#444444',
              backgroundColor: esOscuro ? 'rgba(255,255,255,0.05)' : '#F0F2F5',
              borderBottom: `2px solid ${esOscuro ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'}`,
              padding: '14px 16px',
            },
          },
        },
      },
      MuiTableBody: {
        styleOverrides: {
          root: {
            // Zebra stripes: filas pares con fondo levemente distinto
            '& .MuiTableRow-root:nth-of-type(even)': {
              backgroundColor: esOscuro
                ? 'rgba(255,255,255,0.025)'
                : 'rgba(0,0,0,0.018)',
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:last-child td': { borderBottom: 0 },
            '&.MuiTableRow-hover:hover': {
              backgroundColor: esOscuro
                ? 'rgba(255,255,255,0.06) !important'
                : `${alpha(c.primario, 0.05)} !important`,
              transition: 'background-color 0.12s ease',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: esOscuro ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
            padding: '12px 16px',
            // Texto de celdas siempre legible
            color: esOscuro ? '#DCDCDC' : 'inherit',
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, fontSize: '0.75rem' },
          sizeSmall: { height: 22, fontSize: '0.7rem' },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 8 } } },
      },
      MuiTabs: {
        styleOverrides: { indicator: { height: 3, borderRadius: '3px 3px 0 0' } },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.875rem',
            '&.Mui-selected': { fontWeight: 700 },
          },
        },
      },
      MuiAlert: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
      MuiDialogTitle: {
        styleOverrides: { root: { fontWeight: 700, fontSize: '1.125rem', paddingBottom: 8 } },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            backgroundColor: esOscuro ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          },
        },
      },
      // ToggleButton: mejorar contraste en modo oscuro
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.825rem',
            borderColor: esOscuro ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
            color: esOscuro ? '#BBBBBB' : '#444444',
            '&.Mui-selected': {
              fontWeight: 700,
              color: esOscuro ? '#FFFFFF' : c.primario,
              backgroundColor: esOscuro
                ? 'rgba(255,255,255,0.12)'
                : alpha(c.primario, 0.08),
              borderColor: esOscuro ? 'rgba(255,255,255,0.25)' : alpha(c.primario, 0.4),
            },
          },
        },
      },
    },
  });
}

const temaPorDefecto = buildTheme(null);
export default temaPorDefecto;
