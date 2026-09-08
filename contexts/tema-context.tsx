'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { temaService } from '@/lib/services';
import type { OrganizacionTema } from '@/types';

interface TemaContextValue {
  tema: OrganizacionTema | null;
  cargando: boolean;
}

const TemaContext = createContext<TemaContextValue>({ tema: null, cargando: true });

// Cada despliegue de frontend corresponde a una Alcaldía (ej: funza.sigpa.gov.co),
// así que el dominio institucional se fija por variable de entorno en build/deploy.
// El backend sí es multi-tenant real (un solo backend puede servir a varias
// Alcaldías), pero el frontend de cada una vive en su propio dominio público,
// así que esta variable determina qué tema pedir a /api/v1/public/tema.
const DOMINIO_TENANT = process.env.NEXT_PUBLIC_TENANT_DOMAIN || '';

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<OrganizacionTema | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!DOMINIO_TENANT) {
      // Sin dominio configurado, se usa el tema neutro por defecto (útil en
      // desarrollo local genérico). No es un error, solo falta configuración.
      setCargando(false);
      return;
    }
    temaService
      .obtenerPorDominio(DOMINIO_TENANT)
      .then((resultado) => setTema(resultado))
      .catch(() => setTema(null))
      .finally(() => setCargando(false));
  }, []);

  return <TemaContext.Provider value={{ tema, cargando }}>{children}</TemaContext.Provider>;
}

export function useTema() {
  return useContext(TemaContext);
}
