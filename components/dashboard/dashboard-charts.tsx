'use client';

import { Box, Typography, Stack, LinearProgress, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  BarChart, Bar, LabelList, LineChart, Line, Legend, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import ChartCard from './chart-card';
import type { DashboardCompleto, Alerta, HistorialCambio } from '@/types';

const COLORES_ESTADO: Record<string, string> = {
  Activo: '#16A34A', 'En reposo': '#F59E0B', 'En mantenimiento': '#EA580C',
  'En comodato': '#2563EB', 'Dado de baja': '#9CA3AF', Otro: '#6B7280',
};
const COLOR_NIVEL: Record<string, string> = {
  Preventiva: '#2563EB', Importante: '#F59E0B', Prioritaria: '#EA580C',
  Urgente: '#DA151C', Critica: '#7F1D1D',
};
const ETIQUETAS_ACCION: Record<string, string> = {
  CREACION: 'Creó', ACTUALIZACION: 'Actualizó',
  CAMBIO_ESTADO: 'Cambió el estado de', ELIMINACION: 'Dio de baja',
};

function SinDatos({ mensaje = 'Sin datos suficientes todavía' }: { mensaje?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Typography variant="body2" color="text.secondary">{mensaje}</Typography>
    </Box>
  );
}

// Renderizador personalizado de porcentaje sobre cada barra
function RenderPorcentajeLabel({ x, y, width, value, total }: { x?: string | number; y?: string | number; width?: string | number; value?: string | number; total: number }) {
  const numValue = Number(value);
  const numWidth = Number(width);
  const numX = Number(x);
  const numY = Number(y);
  if (!numValue || !total || !numWidth) return null;
  const pct = Math.round((numValue / total) * 100);
  return (
    <text x={numX + numWidth / 2} y={numY - 5} textAnchor="middle" fontSize={10} fontWeight={600} fill="#555">
      {pct}%
    </text>
  );
}

export function GraficoPorEstado({ datos }: { datos: DashboardCompleto }) {
  const pct = datos.kpis.total_vehiculos > 0
    ? Math.round((datos.kpis.vehiculos_activos / datos.kpis.total_vehiculos) * 100) : 0;
  return (
    <ChartCard titulo="Vehículos por estado">
      {datos.por_estado?.length ? (
        <Box sx={{ position: 'relative', height: '100%' }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={datos.por_estado} dataKey="total" nameKey="etiqueta" cx="50%" cy="45%" innerRadius={58} outerRadius={90} paddingAngle={2}>
                {datos.por_estado.map((entry, i) => (
                  <Cell key={i} fill={COLORES_ESTADO[entry.etiqueta] || '#9CA3AF'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <Box sx={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
            <Typography variant="h5" fontWeight={700}>{pct}%</Typography>
            <Typography variant="caption" color="text.secondary">Activos</Typography>
          </Box>
          <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1} sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, pb: 0.5 }}>
            {datos.por_estado.map((e) => (
              <Stack key={e.etiqueta} direction="row" spacing={0.5} alignItems="center">
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: COLORES_ESTADO[e.etiqueta] || '#9CA3AF', flexShrink: 0 }} />
                <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary' }}>{e.etiqueta} ({e.total})</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      ) : <SinDatos />}
    </ChartCard>
  );
}

export function GraficoPorTipo({ datos }: { datos: DashboardCompleto }) {
  const theme = useTheme();
  const total = datos.por_tipo?.reduce((s, d) => s + d.total, 0) || 1;
  return (
    <ChartCard titulo="Tipos de vehículos activos">
      {datos.por_tipo?.length ? (
        <ResponsiveContainer>
          <BarChart data={datos.por_tipo} margin={{ top: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }} />
            <Bar dataKey="total" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="total"
                content={(props) => RenderPorcentajeLabel({ ...(props as { x?: string | number; y?: string | number; width?: string | number; value?: string | number }), total })}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : <SinDatos />}
    </ChartCard>
  );
}

// ── Tres gráficos independientes de vencimientos ───────────────────────────

export function GraficoVencimientosSOAT({ datos }: { datos: DashboardCompleto }) {
  const data = datos.vencimientos_por_mes_tipo?.map((d) => ({ mes: d.mes, total: d.soat })) || [];
  return (
    <ChartCard titulo="SOAT — vencimientos por mes">
      {data.some((d) => d.total > 0) ? (
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }} />
            <Bar dataKey="total" name="SOAT" fill="#DA151C" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="total" position="top" style={{ fontSize: 10, fontWeight: 600, fill: '#444' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : <SinDatos mensaje="Sin vencimientos de SOAT próximos" />}
    </ChartCard>
  );
}

export function GraficoVencimientosTecno({ datos }: { datos: DashboardCompleto }) {
  const data = datos.vencimientos_por_mes_tipo?.map((d) => ({ mes: d.mes, total: d.tecnomecanica })) || [];
  return (
    <ChartCard titulo="Tecnomecánica — vencimientos por mes">
      {data.some((d) => d.total > 0) ? (
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }} />
            <Bar dataKey="total" name="Tecnomecánica" fill="#F59E0B" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="total" position="top" style={{ fontSize: 10, fontWeight: 600, fill: '#444' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : <SinDatos mensaje="Sin vencimientos de Tecnomecánica próximos" />}
    </ChartCard>
  );
}

export function GraficoVencimientosPoliza({ datos }: { datos: DashboardCompleto }) {
  const data = datos.vencimientos_por_mes_tipo?.map((d) => ({ mes: d.mes, total: d.poliza })) || [];
  return (
    <ChartCard titulo="Póliza de seguros — vencimientos por mes">
      {data.some((d) => d.total > 0) ? (
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }} />
            <Bar dataKey="total" name="Póliza" fill="#16A34A" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="total" position="top" style={{ fontSize: 10, fontWeight: 600, fill: '#444' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : <SinDatos mensaje="Sin vencimientos de Póliza próximos" />}
    </ChartCard>
  );
}

// Mantener por compatibilidad (ya no se usa en dashboard pero puede usarse en reportes)
export function GraficoVencimientosMes({ datos }: { datos: DashboardCompleto }) {
  return (
    <ChartCard titulo="Vencimientos por mes (SOAT / Tecno. / Póliza)">
      {datos.vencimientos_por_mes_tipo?.length ? (
        <ResponsiveContainer>
          <LineChart data={datos.vencimientos_por_mes_tipo}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="soat" name="SOAT" stroke="#DA151C" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="tecnomecanica" name="Tecno." stroke="#F59E0B" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="poliza" name="Póliza" stroke="#16A34A" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : <SinDatos />}
    </ChartCard>
  );
}

export function GraficoPorDependencia({ datos }: { datos: DashboardCompleto }) {
  const theme = useTheme();
  return (
    <ChartCard titulo="Vehículos por dependencia" altura={320}>
      {datos.por_dependencia?.length ? (
        <ResponsiveContainer>
          <BarChart data={datos.por_dependencia} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="etiqueta" width={140} tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }} />
            <Bar dataKey="total" fill={theme.palette.primary.main} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : <SinDatos />}
    </ChartCard>
  );
}

export function PanelAlertasRecientes({ alertas, placaPorVehiculo }: { alertas: Alerta[]; placaPorVehiculo: Map<number, string> }) {
  return (
    <ChartCard titulo="Alertas recientes" altura={280}>
      {alertas.length ? (
        <Stack spacing={1} sx={{ overflowY: 'auto', height: '100%' }}>
          {alertas.slice(0, 6).map((a) => (
            <Box key={a.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: COLOR_NIVEL[a.tipo_alerta] || '#9CA3AF', flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {placaPorVehiculo.get(a.vehiculo_id) || `Vehículo #${a.vehiculo_id}`} — {a.tipo_alerta}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>Enviada a {a.destinatario}</Typography>
              </Box>
              <Chip
                label={a.estado_envio}
                size="small"
                color={a.estado_envio === 'Enviada' ? 'success' : a.estado_envio === 'Error' ? 'error' : 'warning'}
                variant="outlined"
              />
            </Box>
          ))}
        </Stack>
      ) : <SinDatos mensaje="No hay alertas pendientes" />}
    </ChartCard>
  );
}

export function PanelDependenciasAlertas({ dependencias, max }: { dependencias: { nombre: string; total: number }[]; max: number }) {
  return (
    <ChartCard titulo="Dependencias con más alertas" altura={280}>
      {dependencias.length ? (
        <Stack spacing={1.5} sx={{ height: '100%', justifyContent: 'center' }}>
          {dependencias.map((d) => (
            <Box key={d.nombre}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: '70%' }}>{d.nombre}</Typography>
                <Typography variant="body2" fontWeight={700} color={d.total > 3 ? 'error.main' : 'warning.main'}>{d.total} alertas</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={(d.total / max) * 100} color={d.total > 3 ? 'error' : 'warning'} sx={{ height: 6, borderRadius: 3 }} />
            </Box>
          ))}
        </Stack>
      ) : <SinDatos mensaje="Sin alertas pendientes por dependencia" />}
    </ChartCard>
  );
}

export function PanelActividadReciente({ actividad }: { actividad: HistorialCambio[] }) {
  return (
    <ChartCard titulo="Actividad reciente" altura={280}>
      {actividad.length ? (
        <Stack spacing={1.5} sx={{ overflowY: 'auto', height: '100%' }}>
          {actividad.map((ev) => (
            <Box key={ev.id} sx={{ display: 'flex', gap: 1.5 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                {(ev.usuario_nombre || 'S').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" fontWeight={600} sx={{ display: 'block' }} noWrap>{ev.usuario_nombre || 'Sistema'}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {ETIQUETAS_ACCION[ev.accion] || ev.accion}{ev.referencia ? ` — ${ev.referencia}` : ''}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10 }}>
                  {new Date(ev.fecha).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      ) : <SinDatos mensaje="Sin actividad reciente" />}
    </ChartCard>
  );
}
