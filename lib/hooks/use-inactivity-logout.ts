'use client';

import { useEffect, useRef } from 'react';
import { sessionService } from '@/lib/services';

// Eventos que cuentan como "actividad del usuario" — cualquiera de estos
// reinicia el temporizador de inactividad. Se usa passive:true para no
// afectar el rendimiento del scroll/touch.
const EVENTOS_ACTIVIDAD = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

/**
 * Cierra la sesión automáticamente después de N minutos sin actividad del
 * usuario (sin mouse, teclado, scroll ni clics). El valor de N se consulta
 * al backend (GET /public/session-timeout, configurable vía la variable
 * de entorno SESSION_TIMEOUT_MINUTES) en vez de estar fijo en el código,
 * para que el Administrador pueda ajustarlo sin recompilar el frontend.
 *
 * No muestra ningún aviso previo: al agotarse el tiempo, se ejecuta
 * `logout()` directamente y el propio AuthContext redirige a /login.
 *
 * @param logout Función de cierre de sesión (ya existe en useAuth()).
 * @param activo Si es false, el hook no hace nada — útil para no activar
 *   el temporizador antes de que haya una sesión iniciada.
 */
export function useInactivityLogout(logout: () => void, activo: boolean) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minutosRef = useRef<number>(5);

  useEffect(() => {
    if (!activo) return;

    let cancelado = false;

    // Se consulta el timeout configurado una sola vez al activarse el
    // hook (ej. al iniciar sesión) — no en cada evento de actividad, para
    // no saturar el backend con peticiones innecesarias.
    sessionService
      .obtenerTimeout()
      .then((res) => {
        if (!cancelado && res?.timeout_minutes > 0) {
          minutosRef.current = res.timeout_minutes;
        }
      })
      .catch(() => {
        // Si falla la consulta, se mantiene el valor por defecto (5 min)
        // en vez de desactivar el cierre automático — es preferible un
        // timeout conservador a no tener ninguno por un error de red.
      })
      .finally(() => {
        if (!cancelado) reiniciarTemporizador();
      });

    function reiniciarTemporizador() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        logout();
      }, minutosRef.current * 60 * 1000);
    }

    function manejarActividad() {
      reiniciarTemporizador();
    }

    EVENTOS_ACTIVIDAD.forEach((evento) => window.addEventListener(evento, manejarActividad, { passive: true }));

    return () => {
      cancelado = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      EVENTOS_ACTIVIDAD.forEach((evento) => window.removeEventListener(evento, manejarActividad));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo]);
}
