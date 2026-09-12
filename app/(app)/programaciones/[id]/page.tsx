'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Paper, Typography, CircularProgress, Alert, Stack, Button, Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AppShell from '@/components/layout/app-shell';
import { programacionesService } from '@/lib/services';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { generarPDFDesdeElemento } from '@/lib/generar-pdf';
import type { Programacion } from '@/types';

function formatFechaLarga(fecha: string): string {
  const d = new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
}

// Devuelve la fecha partida en máximo 2 líneas legibles: el día de la
// semana en la primera línea y "día de mes de año" en la segunda — en vez
// de partir el texto por cada espacio (lo que dejaba el número del día
// solo, cortado, en una tercera línea dentro de una celda angosta).
function formatFechaDosLineas(fecha: string): [string, string] {
  const d = new Date(fecha + 'T00:00:00');
  const diaSemana = d.toLocaleDateString('es-CO', { weekday: 'long' }).toUpperCase();
  const resto = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  return [diaSemana + ',', resto];
}

export default function ProgramacionDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { usuario } = useAuth();
  const id = Number(params.id);

  const [prog, setProg] = useState<Programacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  // El backend devuelve TODAS las filas de la programación (incluidas las
  // que aún no fueron marcadas como "programado"), porque no se deben
  // perder al guardar. La vista de PANTALLA muestra todas las filas
  // (atenuando visualmente las pendientes) para que el director vea de
  // inmediato cuando llega una nueva solicitud — solo el PDF/impresión
  // oficial se limita a las confirmadas, ya que ese es el documento que
  // efectivamente sale de la alcaldía.
  const itemsProgramados = (prog?.items || []).filter((it) => it.programado);
  const progParaImprimir = prog ? { ...prog, items: itemsProgramados } : null;
  const hayPendientes = (prog?.items || []).some((it) => !it.programado);

  const puedeEditar = usuario && ['Administrador', 'Dependencia'].includes(usuario.rol_nombre);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    programacionesService.obtener(id)
      .then(setProg)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudo cargar la programación'))
      .finally(() => setCargando(false));
  }, [id]);

  useEffect(() => { if (id) cargar(); }, [id, cargar]);

  return (
    <AppShell titulo="Programación Diaria">
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/programaciones')} size="small">
          Volver al listado
        </Button>
        <Stack direction="row" spacing={1}>
          {puedeEditar && prog && (
            <Button variant="outlined" size="small" startIcon={<EditOutlinedIcon />} onClick={() => router.push(`/programaciones/${id}/editar`)}>
              Editar
            </Button>
          )}
          {prog && (
            <Button
              variant="contained"
              size="small"
              startIcon={generandoPDF ? <CircularProgress size={14} color="inherit" /> : <PictureAsPdfOutlinedIcon />}
              disabled={generandoPDF}
              onClick={async () => {
                setGenerandoPDF(true);
                try {
                  await generarPDFDesdeElemento('programacion-print-area', `programacion_${prog.fecha}.pdf`);
                } catch {
                  // La generación de PDF es una conveniencia — si falla no
                  // bloqueamos al usuario con un error intrusivo, solo se
                  // deja de descargar el archivo.
                } finally {
                  setGenerandoPDF(false);
                }
              }}
            >
              {generandoPDF ? 'Generando…' : 'Generar PDF'}
            </Button>
          )}
        </Stack>
      </Stack>

      {cargando && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error">{error}</Alert>}

      {prog && (
        <>
          {/* ── Vista normal (pantalla) ── */}
          <Box className="no-print">
            <Paper sx={{ p: 2, mb: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>📅</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                    {formatFechaLarga(prog.fecha)}
                  </Typography>
                  <Chip label="15-FR-36" size="small" variant="outlined" sx={{ fontSize: '0.68rem', mt: 0.5 }} />
                </Box>
              </Stack>
              {hayPendientes && (
                <Alert severity="info" sx={{ mt: 2, fontSize: '0.8rem' }}>
                  Hay filas sin marcar como "Programado" (solicitudes pendientes de asignar conductor/vehículo).
                  Entra a Editar para completarlas — no aparecerán en el PDF hasta que las confirmes.
                </Alert>
              )}
            </Paper>
            <Paper sx={{ overflow: 'auto' }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 950 }}>
                  <Box component="thead">
                    <Box component="tr" sx={{ bgcolor: '#1A1A2E' }}>
                      {['ESTADO', 'VEHÍCULO', 'CONDUCTOR', 'DEPENDENCIA', 'DESTINO', 'HORA DE SERVICIO Y PUNTO', 'HORA DE FINALIZACIÓN', 'ACTIVIDAD'].map((h) => (
                        <Box component="th" key={h} sx={{ p: 1.25, color: '#fff', fontWeight: 700, fontSize: '0.72rem', textAlign: 'center', letterSpacing: '0.06em', border: '1px solid #333' }}>
                          {h}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {(prog.items || []).length === 0 ? (
                      <Box component="tr">
                        <Box component="td" sx={{ p: 3, textAlign: 'center', color: 'text.secondary', border: '1px solid #E0E0E0' }} colSpan={8}>
                          Esta programación todavía no tiene filas registradas.
                        </Box>
                      </Box>
                    ) : (prog.items || []).map((item, i) => (
                      <Box component="tr" key={i} sx={{ bgcolor: item.es_vacaciones ? '#FFF8E1' : i % 2 === 0 ? '#fff' : '#F9F9FA', opacity: item.programado ? 1 : 0.65 }}>
                        <Box component="td" sx={{ p: 1, fontSize: '0.7rem', border: '1px solid #E0E0E0', textAlign: 'center' }}>
                          {item.programado ? (
                            <Box component="span" sx={{ color: '#16A34A', fontWeight: 700 }}>✓ Programado</Box>
                          ) : item.origen === 'solicitud' ? (
                            <Box component="span" sx={{ color: '#2563EB', fontWeight: 700 }}>Solicitud pendiente</Box>
                          ) : (
                            <Box component="span" sx={{ color: 'text.disabled', fontWeight: 600 }}>Sin marcar</Box>
                          )}
                        </Box>
                        {[item.vehiculo_placa || '—', item.conductor, item.dependencia, item.destino, item.hora_salida_punto, item.hora_finalizacion, item.actividad].map((val, ci) => (
                          <Box component="td" key={ci} sx={{ p: 1, fontSize: '0.8rem', border: '1px solid #E0E0E0', textAlign: ci === 0 ? 'center' : 'left', fontWeight: item.es_vacaciones ? 700 : 400 }}>
                            {val}
                          </Box>
                        ))}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>

          {/* ── Vista de impresión (formato 15-FR-36 exacto) — solo filas programadas ── */}
          {progParaImprimir && <PrintView prog={progParaImprimir} />}
        </>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .no-print { display: none !important; }
          .print-area { position: fixed; top: 0; left: 0; width: 100%; }
          @page { size: A4 landscape; margin: 10mm; }
        }
        @media screen { .print-area { display: none; } }
      `}</style>
    </AppShell>
  );
}

function PrintView({ prog }: { prog: Programacion }) {
  const fechaDosLineas = formatFechaDosLineas(prog.fecha);

  return (
    <div id="programacion-print-area" className="print-area" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#000' }}>
      {/* Encabezado */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
        <tbody>
          <tr>
            <td style={{ width: 120, border: '2px solid #000', padding: '4px 8px', verticalAlign: 'middle' }}>
              <img src="/logo-funza.png" alt="Alcaldía de Funza" style={{ width: '100%', maxWidth: 110, display: 'block' }} />
            </td>
            <td style={{ border: '2px solid #000', padding: '6px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
              <div style={{ fontSize: '16pt', fontWeight: 'bold', letterSpacing: 1 }}>PROGRAMACIÓN DIARIA DE VEHÍCULOS</div>
              <div style={{ fontSize: '11pt', fontWeight: 'bold', marginTop: 4 }}>15-FR-36</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Tabla de datos */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000' }}>
        <thead>
          <tr style={{ backgroundColor: '#D9D9D9' }}>
            <th style={{ ...thStyle, width: '13%' }}>FECHA</th>
            <th style={thStyle}>VEHÍCULO</th>
            <th style={thStyle}>CONDUCTOR</th>
            <th style={thStyle}>DEPENDENCIA</th>
            <th style={thStyle}>DESTINO</th>
            <th style={{ ...thStyle, width: '15%' }}>HORA DE SERVICIO Y PUNTO</th>
            <th style={{ ...thStyle, width: '15%' }}>HORA DE FINALIZACIÓN</th>
            <th style={thStyle}>ACTIVIDAD</th>
          </tr>
        </thead>
        <tbody>
          {(prog.items || []).map((item, i) => {
            const bgVac = item.es_vacaciones ? '#FFF3CD' : '#fff';
            return (
              <tr key={i} style={{ backgroundColor: bgVac }}>
                {/*
                  Nota técnica: NO se usa rowSpan para combinar la celda de
                  FECHA en una sola columna que abarque todas las filas.
                  html2canvas (librería usada para generar el PDF) tiene un
                  bug conocido con celdas rowSpan: el contenido se pierde o
                  no se renderiza al capturar la tabla, dejando la columna
                  FECHA completamente vacía en el PDF final. Por eso la
                  fecha se muestra únicamente en la celda de la primera fila
                  (sin combinar), y el resto queda vacía pero con su propio
                  borde — visualmente casi idéntico al diseño original, pero
                  garantizando que el texto se capture correctamente.
                */}
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', verticalAlign: 'middle', width: '13%', backgroundColor: '#fff', whiteSpace: 'nowrap' }}>
                  {i === 0 && fechaDosLineas.map((linea, wi) => <div key={wi}>{linea}</div>)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{item.vehiculo_placa || ''}</td>
                <td style={{ ...tdStyle, fontWeight: item.es_vacaciones ? 700 : 400 }}>{item.conductor}</td>
                <td style={{ ...tdStyle, fontWeight: item.es_vacaciones ? 700 : 400 }}>{item.dependencia}</td>
                <td style={{ ...tdStyle, fontWeight: item.es_vacaciones ? 700 : 400 }}>{item.destino}</td>
                <td style={{ ...tdStyle, fontWeight: item.es_vacaciones ? 700 : 400 }}>{item.hora_salida_punto}</td>
                <td style={{ ...tdStyle, fontWeight: item.es_vacaciones ? 700 : 400 }}>{item.hora_finalizacion}</td>
                <td style={{ ...tdStyle, fontWeight: item.es_vacaciones ? 700 : 400 }}>{item.actividad}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '5px 6px',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '9pt',
  backgroundColor: '#D9D9D9',
};

const tdStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '4px 6px',
  fontSize: '9pt',
  verticalAlign: 'middle',
};
