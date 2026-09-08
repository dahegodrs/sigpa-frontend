'use client';

import { useEffect, useState } from 'react';
import { vehiculosService, alertasService, organizacionService } from '@/lib/services';
import type { Organizacion } from '@/types';

export function useConteosYOrganizacion() {
  const [totalVehiculos, setTotalVehiculos] = useState<number | null>(null);
  // Badge de alertas: muestra alertas NO LEÍDAS (más relevante para el usuario
  // que las "pendientes de envío" que son un estado técnico del motor de correo).
  const [alertasPendientes, setAlertasPendientes] = useState<number | null>(null);
  const [organizacion, setOrganizacion] = useState<Organizacion | null>(null);

  useEffect(() => {
    vehiculosService
      .listar({ page: 1, page_size: 1 })
      .then((res) => setTotalVehiculos(res.meta?.total_items ?? 0))
      .catch(() => setTotalVehiculos(null));

    // Obtiene TODAS las alertas y cuenta las no leídas
    alertasService
      .listar(false)
      .then((lista) => setAlertasPendientes((lista || []).filter((a) => !a.leida).length))
      .catch(() => setAlertasPendientes(null));

    organizacionService
      .obtenerPropia()
      .then(setOrganizacion)
      .catch(() => setOrganizacion(null));
  }, []);

  return { totalVehiculos, alertasPendientes, organizacion };
}
