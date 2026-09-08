'use client';

import { useEffect, useState } from 'react';
import { Grid, Box, Typography, CircularProgress, Alert, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { SvgIconComponent } from '@mui/icons-material';
// Sección titles only
import DirectionsCarIcon from '@mui/icons-material/DirectionsCarOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import AppShell from '@/components/layout/app-shell';
import KpiCard from '@/components/dashboard/kpi-card';
import AlertasPopup from '@/components/alertas/alertas-popup';
import {
  GraficoPorEstado, GraficoPorTipo,
  GraficoVencimientosSOAT, GraficoVencimientosTecno, GraficoVencimientosPoliza,
  PanelAlertasRecientes, PanelDependenciasAlertas,
  PanelActividadReciente,
} from '@/components/dashboard/dashboard-charts';
import { dashboardService, alertasService, vehiculosService, historialService } from '@/lib/services';
import { ApiError } from '@/lib/api-client';
import type { DashboardCompleto, Alerta, Vehiculo, HistorialCambio } from '@/types';

// ── Custom SVG icons — únicos por métrica ─────────────────────────────────

function IconoFlota() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 16.5L5.5 9.5C5.9 8.4 7 7.5 8.2 7.5H17.8C19 7.5 20.1 8.4 20.5 9.5L23 16.5" />
      <path d="M2 16.5H24V19.5C24 20.3 23.3 21 22.5 21H3.5C2.7 21 2 20.3 2 19.5V16.5Z" />
      <circle cx="7" cy="17.5" r="2" fill="white" stroke="none" />
      <circle cx="19" cy="17.5" r="2" fill="white" stroke="none" />
      <path d="M8.5 12H17.5" />
    </svg>
  );
}

function IconoActivos() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M13 3C7.48 3 3 7.48 3 13s4.48 10 10 10 10-4.48 10-10S18.52 3 13 3z" fill="white" fillOpacity="0.25" />
      <path d="M8.5 13.5l3 3 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoMantenimiento() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 3.5a4.5 4.5 0 0 1 .9 5.1l6.1 6.1a1.5 1.5 0 0 1 0 2.1l-2.1 2.1a1.5 1.5 0 0 1-2.1 0L13.1 12.7a4.5 4.5 0 0 1-5.1-.9 4.5 4.5 0 0 1 0-6.3L11 8.5l1.5-1.5-3-3.5z" />
      <circle cx="9" cy="18" r="1" fill="white" stroke="none" />
      <path d="M6 21l4-4" strokeWidth="1.5" />
    </svg>
  );
}

function IconoAlmacenados() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="20" height="12" rx="2" />
      <path d="M3 11l2.5-6h15l2.5 6" />
      <path d="M10 17h6" />
      <circle cx="8.5" cy="17" r="1.2" fill="white" stroke="none" />
      <circle cx="17.5" cy="17" r="1.2" fill="white" stroke="none" />
      <path d="M13 7v4" strokeDasharray="2 2" />
    </svg>
  );
}

function IconoComodato() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9h14M14 5l4 4-4 4" />
      <path d="M22 17H8M8 21l-4-4 4-4" />
    </svg>
  );
}

function IconoMaquinaria() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18h16" />
      <path d="M8 18V9l5-4 2 3" />
      <path d="M13 8l5 4v6" />
      <circle cx="6" cy="20" r="2" />
      <circle cx="17" cy="20" r="2" />
      <path d="M13 12h4" />
    </svg>
  );
}

function IconoDocVencido() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M13 3C7.48 3 3 7.48 3 13s4.48 10 10 10 10-4.48 10-10S18.52 3 13 3z" fill="white" fillOpacity="0.22" />
      <path d="M9.5 9.5l7 7M16.5 9.5l-7 7" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IconoPorVencer() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h8" />
      <path d="M9 23h8" />
      <path d="M9 3C9 3 5 6.5 5 13s4 10 4 10" />
      <path d="M17 3s4 3.5 4 10-4 10-4 10" />
      <path d="M13 9v5l3 2" />
    </svg>
  );
}

function IconoPolizaVencida() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="16" height="20" rx="2" />
      <path d="M9 9h8M9 13h5" />
      <path d="M15 17l2 2 4-4" strokeWidth="2" />
      <path d="M15 17l-1.5-1.5" stroke="white" strokeWidth="2" />
    </svg>
  );
}

function IconoSaludDocumental({ color }: { color: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 13h4l2-6 4 12 3-8 2 2h7" />
    </svg>
  );
}

// ── Sección título ────────────────────────────────────────────────────────

function SeccionTitulo({ icono: Icono, titulo }: { icono: SvgIconComponent; titulo: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
      <Icono sx={{ color: 'text.secondary', fontSize: 18 }} />
      <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontSize: '0.72rem' }}>
        {titulo}
      </Typography>
    </Stack>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────

export default function DashboardPage() {
  const theme = useTheme();
  const [datos, setDatos] = useState<DashboardCompleto | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [actividad, setActividad] = useState<HistorialCambio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      dashboardService.obtenerResumen(),
      alertasService.listar(false),
      vehiculosService.listar({ page_size: 200 }),
      historialService.reciente(8),
    ])
      .then(([resumen, listaAlertas, listaVehiculos, listaActividad]) => {
        setDatos(resumen);
        setAlertas(listaAlertas || []);
        setVehiculos(listaVehiculos.data || []);
        setActividad(listaActividad || []);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudo cargar el dashboard'))
      .finally(() => setCargando(false));
  }, []);

  const dependenciaPorVehiculo = new Map(vehiculos.map((v) => [v.id, v.dependencia_nombre || 'Sin asignar']));
  const conteoAlertasPorDependencia = new Map<string, number>();
  alertas.filter((a) => !a.leida).forEach((a) => {
    const dep = dependenciaPorVehiculo.get(a.vehiculo_id) || 'Sin asignar';
    conteoAlertasPorDependencia.set(dep, (conteoAlertasPorDependencia.get(dep) || 0) + 1);
  });
  const dependenciasConMasAlertas = Array.from(conteoAlertasPorDependencia.entries())
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
  const maxAlertasDependencia = Math.max(1, ...dependenciasConMasAlertas.map((d) => d.total));
  const placaPorVehiculo = new Map(vehiculos.map((v) => [v.id, v.placa]));

  const saludPct = datos?.kpis.salud_documental_pct ?? 0;
  const colorSalud = saludPct >= 80 ? '#16A34A' : saludPct >= 50 ? '#F59E0B' : theme.palette.primary.main;
  const alertasSinLeer = alertas.filter((a) => !a.leida);

  return (
    <AppShell titulo="Dashboard Ejecutivo">
      {cargando && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error">{error}</Alert>}

      {datos && (
        <>
          {/* ── Estado de la Flota ── */}
          <SeccionTitulo icono={DirectionsCarIcon} titulo="Estado de la Flota" />
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="Total vehículos" valor={datos.kpis.total_vehiculos} iconePersonalizado={<IconoFlota />} color="#F87176" colorFin="#FFA8AB" href="/vehiculos" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="Activos" valor={datos.kpis.vehiculos_activos} iconePersonalizado={<IconoActivos />} color="#4CC87A" colorFin="#79D99D" href="/vehiculos?estado_id=1" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="En mantenimiento" valor={datos.kpis.vehiculos_en_mantenimiento} iconePersonalizado={<IconoMantenimiento />} color="#FF9252" colorFin="#FFBA80" href="/vehiculos?estado_id=3" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="En reposo" valor={datos.kpis.vehiculos_en_reposo} iconePersonalizado={<IconoAlmacenados />} color="#9FAED4" colorFin="#BFC8E0" href="/vehiculos?estado_id=2" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="En comodato" valor={datos.kpis.vehiculos_en_comodato} iconePersonalizado={<IconoComodato />} color="#6B9FFF" colorFin="#96BBFF" href="/vehiculos?estado_id=4" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard
                titulo="Maquinaria"
                valor={datos.por_tipo.find((t) => t.etiqueta === 'Maquinaria')?.total || 0}
                iconePersonalizado={<IconoMaquinaria />}
                color="#8B9DC4"
                colorFin="#A8B4D0"
                href="/vehiculos"
              />
            </Grid>
          </Grid>

          {/* ── Salud Documental ── */}
          <SeccionTitulo icono={HealthAndSafetyOutlinedIcon} titulo="Salud Documental" />
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="SOAT vencido" valor={datos.kpis.soat_vencidos} iconePersonalizado={<IconoDocVencido />} color="#F87176" colorFin="#FFA8AB" href="/documentos?estado_documento=Vencido&tipo_documento_id=1" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="SOAT por vencer" valor={datos.kpis.soat_proximos_a_vencer} iconePersonalizado={<IconoPorVencer />} color="#FF9252" colorFin="#FFBA80" href="/documentos?estado_documento=Proximo_a_vencer&tipo_documento_id=1" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="Tecno. vencida" valor={datos.kpis.tecno_vencidos} iconePersonalizado={<IconoDocVencido />} color="#F87176" colorFin="#FFA8AB" href="/documentos?estado_documento=Vencido&tipo_documento_id=2" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="Tecno. por vencer" valor={datos.kpis.tecno_proximos_a_vencer} iconePersonalizado={<IconoPorVencer />} color="#FF9252" colorFin="#FFBA80" href="/documentos?estado_documento=Proximo_a_vencer&tipo_documento_id=2" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="Pólizas vencidas" valor={datos.kpis.polizas_vencidas} iconePersonalizado={<IconoPolizaVencida />} color="#F87176" colorFin="#FFA8AB" href="/documentos?estado_documento=Vencido&tipo_documento_id=3" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard
                titulo="Índice de salud"
                valor={`${Math.round(saludPct)}%`}
                iconePersonalizado={<IconoSaludDocumental color={colorSalud} />}
                color={saludPct >= 80 ? '#4CC87A' : saludPct >= 50 ? '#FFB347' : '#F87176'}
                colorFin={saludPct >= 80 ? '#79D99D' : saludPct >= 50 ? '#FFD08A' : '#FFA8AB'}
                href="/documentos"
              />
            </Grid>
          </Grid>

          {/* ── Análisis Visual ── */}
          <SeccionTitulo icono={BarChartOutlinedIcon} titulo="Análisis Visual" />
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}><GraficoPorEstado datos={datos} /></Grid>
            <Grid item xs={12} md={8}><GraficoPorTipo datos={datos} /></Grid>
          </Grid>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}><GraficoVencimientosSOAT datos={datos} /></Grid>
            <Grid item xs={12} md={4}><GraficoVencimientosTecno datos={datos} /></Grid>
            <Grid item xs={12} md={4}><GraficoVencimientosPoliza datos={datos} /></Grid>
          </Grid>

          {/* ── Alertas y Actividad ── */}
          <SeccionTitulo icono={NotificationsActiveOutlinedIcon} titulo="Alertas y Actividad" />
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><PanelAlertasRecientes alertas={alertasSinLeer} placaPorVehiculo={placaPorVehiculo} /></Grid>
            <Grid item xs={12} md={4}><PanelDependenciasAlertas dependencias={dependenciasConMasAlertas} max={maxAlertasDependencia} /></Grid>
            <Grid item xs={12} md={4}><PanelActividadReciente actividad={actividad} /></Grid>
          </Grid>
        </>
      )}

      <AlertasPopup alertas={alertas} placaPorVehiculo={placaPorVehiculo} />
    </AppShell>
  );
}
