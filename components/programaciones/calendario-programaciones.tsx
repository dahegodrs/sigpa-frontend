'use client';

import { Box, Typography, Tooltip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { Programacion } from '@/types';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface Props {
  anio: number;
  mes: number; // 1-indexed
  programaciones: Programacion[];
  onSeleccionarDia: (fecha: string, programacion?: Programacion) => void;
}

// Genera la grilla de celdas del mes, incluyendo los días de relleno del
// mes anterior/siguiente para completar semanas completas (estilo Google
// Calendar simplificado). Cada celda es { fecha: "YYYY-MM-DD", enMes: bool }.
function construirGrilla(anio: number, mes: number) {
  const primerDia = new Date(anio, mes - 1, 1);
  // getDay() da 0=domingo — se convierte a 0=lunes para alinear con DIAS_SEMANA.
  const offsetInicio = (primerDia.getDay() + 6) % 7;
  const diasEnMes = new Date(anio, mes, 0).getDate();

  const celdas: { fecha: string; dia: number; enMes: boolean }[] = [];

  // Relleno de días del mes anterior
  const mesAnteriorDias = new Date(anio, mes - 1, 0).getDate();
  for (let i = offsetInicio - 1; i >= 0; i--) {
    const dia = mesAnteriorDias - i;
    const fechaObj = new Date(anio, mes - 2, dia);
    celdas.push({ fecha: formatearFecha(fechaObj), dia, enMes: false });
  }

  // Días del mes actual
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fechaObj = new Date(anio, mes - 1, dia);
    celdas.push({ fecha: formatearFecha(fechaObj), dia, enMes: true });
  }

  // Relleno de días del mes siguiente hasta completar múltiplo de 7
  let diaSiguiente = 1;
  while (celdas.length % 7 !== 0) {
    const fechaObj = new Date(anio, mes, diaSiguiente);
    celdas.push({ fecha: formatearFecha(fechaObj), dia: diaSiguiente, enMes: false });
    diaSiguiente++;
  }

  return celdas;
}

function formatearFecha(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CalendarioProgramaciones({ anio, mes, programaciones, onSeleccionarDia }: Props) {
  const theme = useTheme();
  const celdas = construirGrilla(anio, mes);
  const porFecha = new Map(programaciones.map((p) => [p.fecha, p]));

  const hoyStr = formatearFecha(new Date());

  return (
    <Box>
      {/* Encabezado de días de la semana */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
        {DIAS_SEMANA.map((d) => (
          <Typography key={d} variant="caption" fontWeight={700} align="center" color="text.secondary" sx={{ py: 0.5, textTransform: 'uppercase', fontSize: '0.68rem' }}>
            {d}
          </Typography>
        ))}
      </Box>

      {/* Grid de celdas */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.75 }}>
        {celdas.map((celda, idx) => {
          const prog = porFecha.get(celda.fecha);
          const esHoy = celda.fecha === hoyStr;
          const tienePendientes = prog?.tiene_pendientes;

          return (
            <Tooltip
              key={idx}
              title={
                prog
                  ? `${prog.total_programados ?? 0} programado(s) de ${prog.total_items ?? 0} fila(s)${tienePendientes ? ' — Tiene solicitudes pendientes por revisar' : ''}`
                  : celda.enMes ? 'Sin programación — clic para crear' : ''
              }
            >
              <Box
                onClick={() => onSeleccionarDia(celda.fecha, prog)}
                sx={{
                  minHeight: 72,
                  borderRadius: 1.5,
                  p: 0.75,
                  cursor: celda.enMes ? 'pointer' : 'default',
                  border: '1px solid',
                  borderColor: esHoy ? 'primary.main' : 'divider',
                  bgcolor: !celda.enMes
                    ? alpha(theme.palette.text.primary, 0.02)
                    : tienePendientes
                      ? alpha('#DA151C', 0.08)
                      : prog
                        ? alpha('#16A34A', 0.06)
                        : 'background.paper',
                  opacity: celda.enMes ? 1 : 0.4,
                  transition: 'all 0.15s',
                  '&:hover': celda.enMes ? { boxShadow: 1, borderColor: 'primary.main' } : {},
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography variant="caption" fontWeight={esHoy ? 800 : 600} sx={{ color: esHoy ? 'primary.main' : 'text.primary' }}>
                  {celda.dia}
                </Typography>
                {prog && (
                  <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 7, height: 7, borderRadius: '50%',
                        bgcolor: tienePendientes ? '#DA151C' : '#16A34A',
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}>
                      {prog.total_programados ?? 0}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
