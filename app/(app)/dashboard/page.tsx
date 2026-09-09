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

// ── Paleta de categorías del dashboard ──────────────────────────────────
// Cada métrica tiene un color de identidad propio, usado tanto en el borde
// izquierdo de la tarjeta como en su ícono — permite reconocer de un
// vistazo qué tipo de dato se está mirando, siguiendo el estilo de
// dashboards ejecutivos modernos (borde de acento + fondo blanco).
const COLOR_TOTAL = '#F76E6E';        // salmón — visión general de la flota
const COLOR_ACTIVOS = '#22A55A';      // verde — vehículos operando con normalidad
const COLOR_MANTENIMIENTO = '#F5951F'; // naranja — requiere intervención
const COLOR_REPOSO = '#8A93A6';       // gris — fuera de servicio temporalmente
const COLOR_COMODATO = '#2F7DE1';     // azul — cedido a un tercero
const COLOR_MAQUINARIA = '#E5B70A';   // amarillo — maquinaria pesada (código vial)
const COLOR_ROJO_FUNZA = '#DA151C';   // rojo institucional — vencido / crítico
const COLOR_NARANJA_ALERTA = '#F5951F'; // naranja — próximo a vencer
const COLOR_SALUD_INDICE = '#0E9F8E'; // teal — indicador distintivo, no se repite en ninguna otra tarjeta

// ── Íconos SVG a color (monocromáticos, heredan el color de su tarjeta) ──
// Se dibujan con trazos definidos y formas reconocibles (no genéricas de
// IA): un vehículo real con ruedas, un check de disponibilidad, una llave
// de mecánico, una cochera, dos flechas de intercambio, una excavadora, un
// documento con X, un reloj de arena, un escudo con check, un pulso vital.

function IconoFlota({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 16l1.5-5.5A2 2 0 0 1 6.4 9h11.2a2 2 0 0 1 1.9 1.5L21 16" />
      <path d="M3 16h18v2.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V16z" />
      <circle cx="7.5" cy="19" r="1.5" />
      <circle cx="16.5" cy="19" r="1.5" />
      <path d="M7 9V6.5A1.5 1.5 0 0 1 8.5 5h7A1.5 1.5 0 0 1 17 6.5V9" />
    </svg>
  );
}

function IconoActivos({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  );
}

function IconoMantenimiento({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a4 4 0 0 0-5.6 5.6L4 17l3 3 5.1-5.1a4 4 0 0 0 5.6-5.6L15 12l-3-3 2.7-2.7z" />
    </svg>
  );
}

function IconoReposo({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21V10.5L12 4l8 6.5V21" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

function IconoComodato({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h13M13 4l4 4-4 4" />
      <path d="M20 16H7M11 12l-4 4 4 4" />
    </svg>
  );
}

function IconoMaquinaria({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 19h5" />
      <path d="M6 19V8.5L11 5l1.5 3" />
      <path d="M12.5 8L18 12v7" />
      <circle cx="6" cy="20.2" r="1.3" />
      <circle cx="17" cy="20.2" r="1.3" />
      <path d="M12.5 11.5h4" />
    </svg>
  );
}

function IconoDocVencido({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4h4" />
      <path d="M9.5 13.5l5 5M14.5 13.5l-5 5" />
    </svg>
  );
}

function IconoPorVencer({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8v4l2.5 1.5" />
      <circle cx="12" cy="13" r="8" />
      <path d="M9 2h6" />
      <path d="M12 2v3" />
    </svg>
  );
}

function IconoPolizaVencida({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9.5 12l2 2 3.5-3.5" strokeOpacity="0" />
      <path d="M9 9.5l6 6M15 9.5l-6 6" />
    </svg>
  );
}

function IconoSaludDocumental({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-4.35-9.5-9C1 8.5 2.5 5 6 5c2 0 3.2 1.2 4 2.2 0 0 .5 1.3 2 1.3s2-1.3 2-1.3c.8-1 2-2.2 4-2.2 3.5 0 5 3.5 3.5 7-2.5 4.65-9.5 9-9.5 9z" strokeOpacity="0" />
      <path d="M2 13h4l1.5-4 3 8 2-5 1.5 2H21" />
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
              <KpiCard titulo="Total vehículos" valor={datos.kpis.total_vehiculos} iconePersonalizado={<IconoFlota color={COLOR_TOTAL} />} color={COLOR_TOTAL} href="/vehiculos" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="Activos" valor={datos.kpis.vehiculos_activos} iconePersonalizado={<IconoActivos color={COLOR_ACTIVOS} />} color={COLOR_ACTIVOS} href="/vehiculos?estado_id=1" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="En mantenimiento" valor={datos.kpis.vehiculos_en_mantenimiento} iconePersonalizado={<IconoMantenimiento color={COLOR_MANTENIMIENTO} />} color={COLOR_MANTENIMIENTO} href="/vehiculos?estado_id=3" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="En reposo" valor={datos.kpis.vehiculos_en_reposo} iconePersonalizado={<IconoReposo color={COLOR_REPOSO} />} color={COLOR_REPOSO} href="/vehiculos?estado_id=2" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="En comodato" valor={datos.kpis.vehiculos_en_comodato} iconePersonalizado={<IconoComodato color={COLOR_COMODATO} />} color={COLOR_COMODATO} href="/vehiculos?estado_id=4" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard
                titulo="Maquinaria"
                valor={datos.por_tipo.find((t) => t.etiqueta === 'Maquinaria')?.total || 0}
                iconePersonalizado={<IconoMaquinaria color={COLOR_MAQUINARIA} />}
                color={COLOR_MAQUINARIA}
                href="/vehiculos"
              />
            </Grid>
          </Grid>

          {/* ── Salud Documental ── */}
          <SeccionTitulo icono={HealthAndSafetyOutlinedIcon} titulo="Salud Documental" />
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="SOAT vencido" valor={datos.kpis.soat_vencidos} iconePersonalizado={<IconoDocVencido color={COLOR_ROJO_FUNZA} />} color={COLOR_ROJO_FUNZA} href="/documentos?estado_documento=Vencido&tipo_documento_id=1" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="SOAT por vencer" valor={datos.kpis.soat_proximos_a_vencer} iconePersonalizado={<IconoPorVencer color={COLOR_NARANJA_ALERTA} />} color={COLOR_NARANJA_ALERTA} href="/documentos?estado_documento=Proximo_a_vencer&tipo_documento_id=1" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="Tecno. vencida" valor={datos.kpis.tecno_vencidos} iconePersonalizado={<IconoDocVencido color={COLOR_ROJO_FUNZA} />} color={COLOR_ROJO_FUNZA} href="/documentos?estado_documento=Vencido&tipo_documento_id=2" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="Tecno. por vencer" valor={datos.kpis.tecno_proximos_a_vencer} iconePersonalizado={<IconoPorVencer color={COLOR_NARANJA_ALERTA} />} color={COLOR_NARANJA_ALERTA} href="/documentos?estado_documento=Proximo_a_vencer&tipo_documento_id=2" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard titulo="Pólizas vencidas" valor={datos.kpis.polizas_vencidas} iconePersonalizado={<IconoPolizaVencida color={COLOR_ROJO_FUNZA} />} color={COLOR_ROJO_FUNZA} href="/documentos?estado_documento=Vencido&tipo_documento_id=3" />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <KpiCard
                titulo="Índice de salud"
                valor={`${Math.round(saludPct)}%`}
                iconePersonalizado={<IconoSaludDocumental color={COLOR_SALUD_INDICE} />}
                color={COLOR_SALUD_INDICE}
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
