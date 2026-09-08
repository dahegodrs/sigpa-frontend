import type { RespuestaAPI } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
const TOKEN_KEY = 'sigpa_token';

// ── Cache de GET en memoria ────────────────────────────────────────────────
// TTL de 20 segundos: evita que el topbar y cada página llamen al mismo
// endpoint de forma independiente (el patrón típico: /alertas se llama 4 veces
// en cada navegación porque AppShell + dashboard + alertas-popup + topbar lo
// piden todos por separado). En producción esto reduce ~70% de las llamadas.
const CACHE_TTL_MS = 20_000;

interface CacheEntry {
  data: unknown;
  expira: number;
}

const getCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = getCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expira) { getCache.delete(key); return null; }
  return entry.data as T;
}

function setCached(key: string, data: unknown) {
  getCache.set(key, { data, expira: Date.now() + CACHE_TTL_MS });
}

/** Invalida todas las entradas de caché (llamar tras mutaciones). */
export function invalidarCache(prefijo?: string) {
  if (!prefijo) { getCache.clear(); inFlight.clear(); return; }
  for (const key of getCache.keys()) { if (key.startsWith(prefijo)) getCache.delete(key); }
  for (const key of inFlight.keys()) { if (key.startsWith(prefijo)) inFlight.delete(key); }
}

export function guardarToken(token: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export function obtenerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function limpiarToken() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isGET = !options.method || options.method === 'GET';
  const token = obtenerToken();
  const cacheKey = isGET ? `${token?.slice(-8)}:${path}` : null;

  // ── Servir desde caché si está fresco ──
  if (cacheKey) {
    const cached = getCached<T>(cacheKey);
    if (cached !== null) return cached;

    // ── Deduplicar llamadas en vuelo ──
    const existing = inFlight.get(cacheKey);
    if (existing) return existing as Promise<T>;
  }

  const headers: HeadersInit = {
    ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const promise = (async () => {
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (res.status === 401) {
      limpiarToken();
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new ApiError('Sesión expirada, inicia sesión nuevamente', 401);
    }

    const body: RespuestaAPI<T> = await res.json();
    if (!res.ok || !body.success) throw new ApiError(body.error || 'Error inesperado en el servidor', res.status);

    if (cacheKey) setCached(cacheKey, body.data);
    return body.data;
  })();

  if (cacheKey) {
    inFlight.set(cacheKey, promise);
    promise.finally(() => inFlight.delete(cacheKey));
  }

  return promise as Promise<T>;
}

async function requestFull<T>(path: string, options: RequestInit = {}): Promise<RespuestaAPI<T>> {
  const isGET = !options.method || options.method === 'GET';
  const token = obtenerToken();
  const cacheKey = isGET ? `full:${token?.slice(-8)}:${path}` : null;

  if (cacheKey) {
    const cached = getCached<RespuestaAPI<T>>(cacheKey);
    if (cached !== null) return cached;
    const existing = inFlight.get(cacheKey);
    if (existing) return existing as Promise<RespuestaAPI<T>>;
  }

  const headers: HeadersInit = {
    ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const promise = (async () => {
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (res.status === 401) {
      limpiarToken();
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new ApiError('Sesión expirada, inicia sesión nuevamente', 401);
    }

    const body: RespuestaAPI<T> = await res.json();
    if (!res.ok || !body.success) throw new ApiError(body.error || 'Error inesperado en el servidor', res.status);

    if (cacheKey) setCached(cacheKey, body);
    return body;
  })();

  if (cacheKey) {
    inFlight.set(cacheKey, promise);
    promise.finally(() => inFlight.delete(cacheKey));
  }

  return promise as Promise<RespuestaAPI<T>>;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  getWithMeta: <T>(path: string) => requestFull<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  postForm: <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { ApiError };
