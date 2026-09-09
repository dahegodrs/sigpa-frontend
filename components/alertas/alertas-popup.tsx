'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Stack, Button, Chip, Divider, IconButton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { Alerta } from '@/types';

type Severidad = 'red' | 'orange' | 'yellow' | 'green';

const SEVERIDAD_POR_NIVEL: Record<string, Severidad> = {
  Critica: 'red', Urgente: 'orange', Prioritaria: 'yellow',
  Importante: 'yellow', Preventiva: 'green',
};

const ESTILO_SEVERIDAD: Record<Severidad, { label: string; bg: string; color: string; icono: typeof ErrorOutlineIcon }> = {
  red:    { label: 'Crítica',      bg: '#FEF2F2', color: '#DA151C', icono: ErrorOutlineIcon },
  orange: { label: 'Alta',         bg: '#FFF7ED', color: '#EA580C', icono: WarningAmberOutlinedIcon },
  yellow: { label: 'Media',        bg: '#FFFBEB', color: '#D97706', icono: WarningAmberOutlinedIcon },
  green:  { label: 'Informativa',  bg: '#F0FDF4', color: '#16A34A', icono: InfoOutlinedIcon },
};

// Construye un mensaje específico usando el documento real de la alerta
// (ej. "SOAT vencido hace 5 días" / "Tecnomecánica vence en 3 días") en vez
// de un título genérico fijo por nivel — así se sabe exactamente cuál
// documento requiere atención y con qué urgencia, sin tener que entrar al
// vehículo para averiguarlo.
function construirMensajeAlerta(a: Alerta): string {
  const tipoDoc = a.tipo_documento_nombre || 'Documento';
  if (!a.documento_fecha_vencimiento) {
    // Respaldo si no se pudo resolver la fecha real (documento eliminado, etc.)
    const TITULO_POR_NIVEL: Record<string, string> = {
      Critica: `${tipoDoc} vencido`,
      Urgente: `${tipoDoc} vence mañana`,
      Prioritaria: `${tipoDoc} vence en 7 días`,
      Importante: `${tipoDoc} vence en 15 días`,
      Preventiva: `${tipoDoc}: vencimiento próximo`,
    };
    return TITULO_POR_NIVEL[a.tipo_alerta] || `${tipoDoc}: ${a.tipo_alerta}`;
  }

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const vence = new Date(a.documento_fecha_vencimiento); vence.setHours(0, 0, 0, 0);
  const dias = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  if (dias < 0) return `${tipoDoc} vencido hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`;
  if (dias === 0) return `${tipoDoc} vence hoy`;
  if (dias === 1) return `${tipoDoc} vence mañana`;
  return `${tipoDoc} vence en ${dias} días`;
}

interface Props {
  alertas: Alerta[];
  placaPorVehiculo: Map<number, string>;
}

export default function AlertasPopup({ alertas, placaPorVehiculo }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const [abierto, setAbierto] = useState(false);

  const alertasSinLeer = alertas.filter((a) => !a.leida);

  useEffect(() => {
    // Mostrar siempre que haya alertas sin leer al cargar el dashboard
    // (se muestra en cada inicio de sesión)
    if (alertasSinLeer.length > 0) {
      const t = setTimeout(() => setAbierto(true), 800);
      return () => clearTimeout(t);
    }
  }, [alertasSinLeer.length]);

  const cerrar = () => {
    setAbierto(false);
  };

  const irAAlertas = () => {
    cerrar();
    router.push('/alertas');
  };

  if (alertasSinLeer.length === 0) return null;

  // Agrupar por severidad para el resumen
  const conteosPorSev: Record<Severidad, number> = { red: 0, orange: 0, yellow: 0, green: 0 };
  alertasSinLeer.forEach((a) => { conteosPorSev[SEVERIDAD_POR_NIVEL[a.tipo_alerta] || 'yellow']++; });

  // Mostrar máximo 5 alertas en el popup (priorizar las más críticas)
  const alertasMostradas = [...alertasSinLeer]
    .sort((a, b) => {
      const orden: Record<string, number> = { Critica: 0, Urgente: 1, Prioritaria: 2, Importante: 3, Preventiva: 4 };
      return (orden[a.tipo_alerta] ?? 5) - (orden[b.tipo_alerta] ?? 5);
    })
    .slice(0, 5);

  return (
    <Dialog
      open={abierto}
      onClose={cerrar}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            px: 3,
            py: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <NotificationsActiveOutlinedIcon sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2 }}>
              {alertasSinLeer.length} alerta{alertasSinLeer.length !== 1 ? 's' : ''} sin leer
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              Requieren tu atención
            </Typography>
          </Box>
          <IconButton size="small" onClick={cerrar} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Resumen por severidad */}
        <Stack direction="row" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          {(['red', 'orange', 'yellow', 'green'] as Severidad[])
            .filter((s) => conteosPorSev[s] > 0)
            .map((sev) => {
              const e = ESTILO_SEVERIDAD[sev];
              return (
                <Box key={sev} sx={{ flex: 1, py: 1.5, px: 1, textAlign: 'center', bgcolor: e.bg }}>
                  <Typography variant="h6" fontWeight={700} sx={{ color: e.color, lineHeight: 1 }}>
                    {conteosPorSev[sev]}
                  </Typography>
                  <Typography variant="caption" fontWeight={600} sx={{ color: e.color, fontSize: '0.65rem' }}>
                    {e.label}
                  </Typography>
                </Box>
              );
            })}
        </Stack>

        {/* Lista de alertas */}
        <Stack divider={<Divider />} sx={{ maxHeight: 320, overflowY: 'auto' }}>
          {alertasMostradas.map((a) => {
            const sev = SEVERIDAD_POR_NIVEL[a.tipo_alerta] || 'yellow';
            const estilo = ESTILO_SEVERIDAD[sev];
            const Icono = estilo.icono;
            return (
              <Box key={a.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, py: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    bgcolor: estilo.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icono sx={{ color: estilo.color, fontSize: 20 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
                    <Chip label={placaPorVehiculo.get(a.vehiculo_id) || `#${a.vehiculo_id}`} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700, height: 18, fontSize: '0.68rem' }} />
                    <Chip label={estilo.label} size="small" sx={{ bgcolor: estilo.bg, color: estilo.color, fontWeight: 700, height: 18, fontSize: '0.65rem' }} />
                  </Stack>
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem' }}>
                    {construirMensajeAlerta(a)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(a.fecha_programada).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Typography>
                </Box>
              </Box>
            );
          })}
          {alertasSinLeer.length > 5 && (
            <Box sx={{ px: 3, py: 1.5, bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                +{alertasSinLeer.length - 5} alertas más — ve al Centro de Alertas para verlas todas
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={cerrar} size="small" sx={{ color: 'text.secondary' }}>
          Cerrar
        </Button>
        <Button
          variant="contained"
          size="small"
          endIcon={<ArrowForwardIcon fontSize="small" />}
          onClick={irAAlertas}
        >
          Ver todas las alertas
        </Button>
      </DialogActions>
    </Dialog>
  );
}
