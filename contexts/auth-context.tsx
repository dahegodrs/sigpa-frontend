'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services';
import { guardarToken, limpiarToken, obtenerToken } from '@/lib/api-client';
import type { Usuario } from '@/types';

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  loginConIdToken: (idToken: string) => Promise<void>;
  loginConCredenciales: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USUARIO_KEY = 'sigpa_usuario';

// La pantalla de inicio depende del rol: el rol "Solicitante" tiene acceso
// reducido (solo puede pedir vehículos) y no debe caer en /dashboard, que
// está reservado para roles con visibilidad de todo el parque automotor.
function rutaInicialSegunRol(rolNombre: string): string {
  if (rolNombre === 'Solicitante') return '/solicitar-vehiculo';
  return '/dashboard';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = obtenerToken();
    const usuarioGuardado = typeof window !== 'undefined' ? window.localStorage.getItem(USUARIO_KEY) : null;
    if (token && usuarioGuardado) {
      try {
        setUsuario(JSON.parse(usuarioGuardado));
      } catch {
        limpiarToken();
      }
    }
    setCargando(false);
  }, []);

  const loginConIdToken = useCallback(
    async (idToken: string) => {
      const resultado = await authService.loginConGoogle(idToken);
      guardarToken(resultado.token);
      window.localStorage.setItem(USUARIO_KEY, JSON.stringify(resultado.usuario));
      setUsuario(resultado.usuario);
      router.push(rutaInicialSegunRol(resultado.usuario.rol_nombre));
    },
    [router]
  );

  const loginConCredenciales = useCallback(
    async (email: string, password: string) => {
      const resultado = await authService.loginConCredenciales(email, password);
      guardarToken(resultado.token);
      window.localStorage.setItem(USUARIO_KEY, JSON.stringify(resultado.usuario));
      setUsuario(resultado.usuario);
      router.push(rutaInicialSegunRol(resultado.usuario.rol_nombre));
    },
    [router]
  );

  const logout = useCallback(() => {
    limpiarToken();
    window.localStorage.removeItem(USUARIO_KEY);
    setUsuario(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ usuario, cargando, loginConIdToken, loginConCredenciales, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
