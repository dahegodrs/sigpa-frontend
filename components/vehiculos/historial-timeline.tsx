'use client';

import { Box, Typography, Stack } from '@mui/material';
import type { HistorialCambio, Alerta } from '@/types';

const ETIQUETAS_ACCION: Record<string, string> = {
  CREACION: 'Vehículo creado',
  ACTUALIZACION: 'Información actualizada',
  CAMBIO_ESTADO: 'Cambio de estado',
  ELIMINACION: 'Vehículo dado de baja',
};

const COLOR_NIVEL_ALERTA: Record<string, string> = {
  Preventiva: '#1565C0',
  Importante: '#F9A825',
  Prioritaria: '#E65100',
  Urgente: '#C62828',
  Critica: '#B71C1C',
};

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type EventoUnificado =
  | { tipo: 'historial'; fecha: string; data: HistorialCambio }
  | { tipo: 'alerta'; fecha: string; data: Alerta };

export default function HistorialTimeline({ eventos, alertas = [] }: { eventos: HistorialCambio[]; alertas?: Alerta[] }) {
  const combinados: EventoUnificado[] = [
    ...eventos.map((ev): EventoUnificado => ({ tipo: 'historial', fecha: ev.fecha, data: ev })),
    ...alertas.map((a): EventoUnificado => ({ tipo: 'alerta', fecha: a.fecha_creacion, data: a })),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  if (combinados.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Todavía no hay movimientos registrados.
      </Typography>
    );
  }

  return (
    <Stack spacing={0}>
      {combinados.map((ev, i) => {
        const esUltimo = i === combinados.length - 1;
        const colorPunto = ev.tipo === 'alerta' ? COLOR_NIVEL_ALERTA[ev.data.tipo_alerta] || '#757575' : 'primary.main';

        return (
          <Box key={`${ev.tipo}-${ev.data.id}`} sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: colorPunto, mt: 0.6 }} />
              {!esUltimo && <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', minHeight: 32 }} />}
            </Box>
            <Box sx={{ pb: 3 }}>
              {ev.tipo === 'historial' ? (
                <>
                  <Typography variant="body2" fontWeight={600}>
                    {ETIQUETAS_ACCION[ev.data.accion] || ev.data.accion}
                  </Typography>
                  {ev.data.campo_modificado === 'estado' && ev.data.valor_anterior && ev.data.valor_nuevo && (
                    <Typography variant="body2" color="text.secondary">
                      {ev.data.valor_anterior} → {ev.data.valor_nuevo}
                    </Typography>
                  )}
                  {ev.data.motivo && (
                    <Typography variant="body2" color="text.secondary">
                      {ev.data.motivo}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {formatearFecha(ev.data.fecha)} · {ev.data.usuario_nombre || 'Sistema'}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="body2" fontWeight={600}>
                    Alerta {ev.data.tipo_alerta.toLowerCase()} generada
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enviada a {ev.data.destinatario} · {ev.data.estado_envio}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatearFecha(ev.data.fecha_creacion)}
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}
