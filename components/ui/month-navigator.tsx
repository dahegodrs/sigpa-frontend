'use client';

import { Box, IconButton, Typography, Button, Stack } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';

const NOMBRES_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface Props {
  anio: number;
  mes: number; // 1-indexed
  onCambiar: (anio: number, mes: number) => void;
}

// Navegador de mes reutilizable (‹ Septiembre 2026 ›) — usado tanto en el
// calendario de "Programación" como en el filtro de "Mis solicitudes",
// para dar consistencia visual entre ambas pantallas que sufren el mismo
// problema de escalabilidad (demasiados registros acumulados con el tiempo).
export default function MonthNavigator({ anio, mes, onCambiar }: Props) {
  const irMesAnterior = () => {
    if (mes === 1) onCambiar(anio - 1, 12);
    else onCambiar(anio, mes - 1);
  };
  const irMesSiguiente = () => {
    if (mes === 12) onCambiar(anio + 1, 1);
    else onCambiar(anio, mes + 1);
  };
  const irHoy = () => {
    const hoy = new Date();
    onCambiar(hoy.getFullYear(), hoy.getMonth() + 1);
  };

  const hoy = new Date();
  const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth() + 1;

  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <IconButton size="small" onClick={irMesAnterior} aria-label="Mes anterior">
        <ChevronLeftIcon fontSize="small" />
      </IconButton>
      <Box sx={{ minWidth: 160, textAlign: 'center' }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
          {NOMBRES_MES[mes - 1]} {anio}
        </Typography>
      </Box>
      <IconButton size="small" onClick={irMesSiguiente} aria-label="Mes siguiente">
        <ChevronRightIcon fontSize="small" />
      </IconButton>
      {!esMesActual && (
        <Button size="small" startIcon={<TodayIcon fontSize="small" />} onClick={irHoy} sx={{ ml: 1 }}>
          Hoy
        </Button>
      )}
    </Stack>
  );
}
