'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Modo = 'light' | 'dark';

interface ModoContextValue {
  modo: Modo;
  alternarModo: () => void;
}

const ModoContext = createContext<ModoContextValue>({ modo: 'light', alternarModo: () => {} });

const CLAVE_STORAGE = 'sigpa_modo';

export function ModoProvider({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<Modo>('light');

  useEffect(() => {
    const guardado = window.localStorage.getItem(CLAVE_STORAGE) as Modo | null;
    if (guardado === 'light' || guardado === 'dark') setModo(guardado);
  }, []);

  const alternarModo = () => {
    setModo((prev) => {
      const nuevo = prev === 'light' ? 'dark' : 'light';
      window.localStorage.setItem(CLAVE_STORAGE, nuevo);
      return nuevo;
    });
  };

  return <ModoContext.Provider value={{ modo, alternarModo }}>{children}</ModoContext.Provider>;
}

export function useModo() {
  return useContext(ModoContext);
}
