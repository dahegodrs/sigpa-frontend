'use client';

import { useEffect, useState } from 'react';
import { catalogosService, dependenciasService } from '@/lib/services';
import type { Catalogos, Dependencia } from '@/types';

export function useCatalogos() {
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([catalogosService.obtenerTodos(), dependenciasService.listar()])
      .then(([c, d]) => {
        setCatalogos(c);
        setDependencias(d || []);
      })
      .finally(() => setCargando(false));
  }, []);

  return { catalogos, dependencias, cargando };
}
