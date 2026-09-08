'use client';

import { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Grid, Stack, Button, Tooltip,
  CircularProgress, Alert, LinearProgress, Table, TableHead,
  TableBody, TableRow, TableCell, Chip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import AppShell from '@/components/layout/app-shell';
import ChartCard from '@/components/dashboard/chart-card';
import { dashboardService, vehiculosService, documentosService, dependenciasService, alertasService } from '@/lib/services';
import { exportarCSV } from '@/lib/csv-export';
import { ApiError } from '@/lib/api-client';
import type { DashboardCompleto, Vehiculo, Documento, Dependencia, Alerta } from '@/types';

// ── Iconos SVG personalizados por tipo de reporte ─────────────────────────

function IcoInventario() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20L6.5 12C6.9 10.8 8 10 9.3 10H20.7C22 10 23.1 10.8 23.5 12L26 20" />
      <path d="M3 20H27V23.5C27 24.3 26.3 25 25.5 25H4.5C3.7 25 3 24.3 3 23.5V20Z" />
      <circle cx="8.5" cy="21" r="2.5" fill="white" stroke="none" />
      <circle cx="21.5" cy="21" r="2.5" fill="white" stroke="none" />
      <path d="M10 14H20" strokeWidth="1.4" />
    </svg>
  );
}

function IcoVencidos() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="15" cy="15" r="11" fill="rgba(255,255,255,0.15)" />
      <path d="M15 9v7l4 2" strokeWidth="2" />
      <path d="M10 24l-2 3M20 24l2 3" strokeWidth="1.4" />
    </svg>
  );
}

function IcoActivos() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="15" cy="15" r="11" fill="rgba(255,255,255,0.15)" />
      <path d="M9.5 15.5l4 4L21 11" strokeWidth="2.5" />
    </svg>
  );
}

function IcoDependencia() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="11" height="15" rx="2" fill="rgba(255,255,255,0.15)" />
      <rect x="16" y="5" width="11" height="22" rx="2" fill="rgba(255,255,255,0.2)" />
      <path d="M6 18h5M6 22h3M19 10h5M19 15h5M19 20h5" strokeWidth="1.5" />
    </svg>
  );
}

function IcoCostos() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="15" cy="15" r="11" />
      <path d="M15 9v2M15 19v2M11 13c0-1.1 1.8-2 4-2s4 .9 4 2-1.8 2-4 2-4 .9-4 2 1.8 2 4 2 4-.9 4-2" />
    </svg>
  );
}

function IcoCombustible() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 26V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4l3 2v8" />
      <path d="M7 26h13M10 11h6" />
    </svg>
  );
}

// ── Configuración de widgets ──────────────────────────────────────────────

const WIDGETS_CONFIG = [
  {
    id: 'inventario',
    titulo: 'Inventario de Vehículos',
    descripcion: 'Ficha completa con datos técnicos y asignación',
    gradiente: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
    icono: IcoInventario,
    key: 'exportarInventario' as const,
  },
  {
    id: 'vencidos',
    titulo: 'Documentos Vencidos',
    descripcion: 'SOAT, Tecnomecánica y Pólizas con fecha expirada',
    gradiente: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
    icono: IcoVencidos,
    key: 'exportarDocumentosVencidos' as const,
  },
  {
    id: 'activos',
    titulo: 'Vehículos Activos',
    descripcion: 'Flota en operación clasificada por dependencia',
    gradiente: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
    icono: IcoActivos,
    key: 'exportarActivos' as const,
  },
  {
    id: 'dependencias',
    titulo: 'Resumen por Dependencia',
    descripcion: 'Vehículos, alertas e indicador por secretaría',
    gradiente: 'linear-gradient(135deg, #8B5CF6 0%, #5B21B6 100%)',
    icono: IcoDependencia,
    key: 'exportarResumenDependencias' as const,
  },
  {
    id: 'costos',
    titulo: 'Costos de Mantenimiento',
    descripcion: 'Próximamente — Fase 5 del proyecto',
    gradiente: 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
    icono: IcoCostos,
    key: null,
    deshabilitado: true,
  },
  {
    id: 'combustible',
    titulo: 'Consumo de Combustible',
    descripcion: 'Próximamente — Fase 5 del proyecto',
    gradiente: 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
    icono: IcoCombustible,
    key: null,
    deshabilitado: true,
  },
];

const COLORES_GRAFICO = ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4'];

export default function ReportesPage() {
  const [datos, setDatos] = useState<DashboardCompleto | null>(null);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [documentosVencidos, setDocumentosVencidos] = useState<Documento[]>([]);
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      dashboardService.obtenerResumen(),
      vehiculosService.listar({ page_size: 200 }),
      documentosService.listarGlobal({ estado_documento: 'Vencido', page_size: 200 }),
      dependenciasService.listar(),
      alertasService.listar(false),
    ])
      .then(([resumen, vehiculosRes, docsVencidosRes, listaDependencias, listaAlertas]) => {
        setDatos(resumen);
        setVehiculos(vehiculosRes.data || []);
        setDocumentosVencidos(docsVencidosRes.data || []);
        setDependencias(listaDependencias || []);
        setAlertas(listaAlertas || []);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los reportes'))
      .finally(() => setCargando(false));
  }, []);

  const vehiculosActivos = vehiculos.filter((v) => v.estado_nombre === 'Activo');

  const resumenDependencias = dependencias.map((d) => {
    const vehiculosDep = vehiculos.filter((v) => v.dependencia_id === d.id);
    const alertasDep = alertas.filter((a) => vehiculosDep.some((v) => v.id === a.vehiculo_id));
    const indicador = vehiculosDep.length > 0
      ? Math.max(0, Math.round(100 - (alertasDep.length / vehiculosDep.length) * 100))
      : 100;
    return { nombre: d.nombre, vehiculos: vehiculosDep.length, alertas: alertasDep.length, indicador };
  });

  const exportHandlers = {
    exportarInventario: () => exportarCSV('inventario_vehiculos',
      ['Placa', 'Tipo', 'Marca', 'Línea', 'Modelo', 'Dependencia', 'Responsable', 'Estado'],
      vehiculos.map((v) => [v.placa, v.tipo_vehiculo_nombre || '', v.marca || '', v.linea || '', v.modelo || '', v.dependencia_nombre || '', v.responsable_nombre || '', v.estado_nombre || ''])),
    exportarDocumentosVencidos: () => exportarCSV('documentos_vencidos',
      ['Placa', 'Tipo de documento', 'Fecha de vencimiento'],
      documentosVencidos.map((d) => [d.vehiculo_placa || '', d.tipo_documento_nombre || '', d.fecha_vencimiento ? new Date(d.fecha_vencimiento).toLocaleDateString('es-CO') : ''])),
    exportarActivos: () => exportarCSV('vehiculos_activos',
      ['Placa', 'Tipo', 'Dependencia', 'Responsable'],
      vehiculosActivos.map((v) => [v.placa, v.tipo_vehiculo_nombre || '', v.dependencia_nombre || '', v.responsable_nombre || ''])),
    exportarResumenDependencias: () => exportarCSV('resumen_por_dependencia',
      ['Dependencia', 'Vehículos', 'Alertas', 'Indicador'],
      resumenDependencias.map((d) => [d.nombre, d.vehiculos, d.alertas, `${d.indicador}%`])),
  };

  if (cargando) {
    return (
      <AppShell titulo="Reportes">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      </AppShell>
    );
  }

  return (
    <AppShell titulo="Reportes">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Reportes y Exportaciones</Typography>
          <Typography variant="body2" color="text.secondary">
            Genera y descarga informes del parque automotor
          </Typography>
        </Box>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Widgets de reportes ── */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', fontSize: '0.72rem' }}>
        Reportes disponibles
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {WIDGETS_CONFIG.map((w) => {
          const Ico = w.icono;
          return (
            <Grid item xs={12} sm={6} md={4} key={w.id}>
              <Box
                sx={{
                  borderRadius: '18px',
                  background: w.gradiente,
                  p: 2.5,
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: w.deshabilitado ? 0.65 : 1,
                  boxShadow: w.deshabilitado ? 'none' : '0 4px 16px rgba(0,0,0,0.14)',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  '&:hover': w.deshabilitado ? {} : { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' },
                }}
              >
                {/* Círculo decorativo */}
                <Box aria-hidden sx={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />

                <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box sx={{ flexShrink: 0, mt: 0.25 }}><Ico /></Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2, fontSize: '0.95rem' }}>
                      {w.titulo}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.78)', mt: 0.25, display: 'block' }}>
                      {w.descripcion}
                    </Typography>
                  </Box>
                </Stack>

                {/* Botones de exportar */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', mr: 'auto' }}>
                    Exportar:
                  </Typography>
                  {w.deshabilitado ? (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <LockOutlinedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Próximamente
                      </Typography>
                    </Stack>
                  ) : (
                    <>
                      <Button
                        size="small"
                        onClick={w.key ? exportHandlers[w.key] : undefined}
                        sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.18)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' }, fontWeight: 700, fontSize: '0.72rem', px: 1.5, py: 0.4, borderRadius: 2 }}
                      >
                        CSV
                      </Button>
                      <Tooltip title="Disponible en Fase 4">
                        <span>
                          <Button size="small" disabled sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>PDF</Button>
                        </span>
                      </Tooltip>
                    </>
                  )}
                </Stack>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* ── Gráficos ── */}
      {datos && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <ChartCard titulo="Distribución por tipo de vehículo">
              {datos.por_tipo?.length ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={datos.por_tipo} dataKey="total" nameKey="etiqueta" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                      {datos.por_tipo.map((_, i) => <Cell key={i} fill={COLORES_GRAFICO[i % COLORES_GRAFICO.length]} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <SinDatos />}
            </ChartCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <ChartCard titulo="Proyección de vencimientos (SOAT / Tecno. / Póliza)">
              {datos.vencimientos_por_mes_tipo?.length ? (
                <ResponsiveContainer>
                  <BarChart data={datos.vencimientos_por_mes_tipo}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <ChartTooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="soat" name="SOAT" fill="#EF4444" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="tecnomecanica" name="Tecno." fill="#F59E0B" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="poliza" name="Póliza" fill="#10B981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <SinDatos />}
            </ChartCard>
          </Grid>
        </Grid>
      )}

      {/* ── Resumen por dependencia ── */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>Resumen por dependencia</Typography>
          <Button size="small" startIcon={<DownloadIcon />} onClick={exportHandlers.exportarResumenDependencias}>CSV</Button>
        </Stack>
        {resumenDependencias.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No hay dependencias registradas todavía.</Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 480 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Dependencia</TableCell>
                  <TableCell align="center">Vehículos</TableCell>
                  <TableCell align="center">Alertas</TableCell>
                  <TableCell align="right">Indicador</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resumenDependencias.map((d) => (
                  <TableRow key={d.nombre} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{d.nombre}</TableCell>
                    <TableCell align="center">
                      <Chip label={d.vehiculos} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={700}
                        color={d.alertas > 3 ? 'error.main' : d.alertas > 1 ? 'warning.main' : 'success.main'}>
                        {d.alertas}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                        <Box sx={{ width: 90 }}>
                          <LinearProgress variant="determinate" value={d.indicador}
                            color={d.indicador < 50 ? 'error' : d.indicador < 80 ? 'warning' : 'success'}
                            sx={{ height: 6, borderRadius: 3 }} />
                        </Box>
                        <Typography variant="caption" fontWeight={600} sx={{ minWidth: 30 }}>{d.indicador}%</Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </AppShell>
  );
}

function SinDatos() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Typography variant="body2" color="text.secondary">Sin datos suficientes todavía</Typography>
    </Box>
  );
}
