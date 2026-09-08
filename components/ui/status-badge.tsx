'use client';

import { Chip } from '@mui/material';

const ESTILOS_ESTADO: Record<string, { bg: string; color: string; label: string }> = {
  Vigente: { bg: '#E8F5E9', color: '#2E7D32', label: 'Vigente' },
  Proximo_a_vencer: { bg: '#FFF3E0', color: '#E65100', label: 'Próximo a vencer' },
  Vencido: { bg: '#FFEBEE', color: '#C62828', label: 'Vencido' },
  Pendiente: { bg: '#EEEEEE', color: '#616161', label: 'Pendiente' },
  Activo: { bg: '#E8F5E9', color: '#2E7D32', label: 'Activo' },
  'En reposo': { bg: '#FFF3E0', color: '#E65100', label: 'En reposo' },
  'En mantenimiento': { bg: '#FFF8E1', color: '#F9A825', label: 'En mantenimiento' },
  'En comodato': { bg: '#E3F2FD', color: '#1565C0', label: 'En comodato' },
  'Dado de baja': { bg: '#EEEEEE', color: '#616161', label: 'Dado de baja' },
};

export default function StatusBadge({ estado }: { estado: string }) {
  const estilo = ESTILOS_ESTADO[estado] || { bg: '#EEEEEE', color: '#616161', label: estado };
  return (
    <Chip
      label={estilo.label}
      size="small"
      sx={{
        bgcolor: estilo.bg,
        color: estilo.color,
        fontWeight: 600,
        fontSize: 12,
      }}
    />
  );
}
