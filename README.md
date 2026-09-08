# SIGPA Frontend (Next.js + Material UI)

Frontend del Sistema Integral de Gestión del Parque Automotor. Consume el
backend Go probado en la fase anterior.

## Estado de avance

Implementado y funcional:

- **Autenticación**: pantalla de login con Google Identity Services,
  contexto de sesión (`contexts/auth-context.tsx`), JWT guardado y adjuntado
  automáticamente en cada request (`lib/api-client.ts`).
- **Tema multi-tenant dinámico**: el branding (logo, colores, tipografía) se
  carga desde `GET /api/v1/public/tema?dominio=...` usando la variable de
  entorno `NEXT_PUBLIC_TENANT_DOMAIN` — no hay colores hardcodeados de una
  Alcaldía específica. Ver `contexts/tema-context.tsx` y `lib/theme.ts`.
- **Layout general**: sidebar + topbar (`components/layout/`), con
  navegación filtrada según el rol del usuario autenticado.
- **Dashboard Ejecutivo**: KPIs y gráficos (Recharts) conectados al endpoint
  real `GET /api/v1/dashboard` — vehículos por dependencia/tipo/estado,
  vencimientos por mes, salud documental.
- **Capa de servicios**: `lib/services.ts` tiene ya definidos los llamados
  para todos los módulos del backend (vehículos, documentos, alertas,
  dependencias, usuarios, catálogos, tema) — listos para conectar a medida
  que se construyen las páginas restantes.

Pendiente (próximos pasos):

- Listado y ficha de detalle de **Vehículos** (con documentos, historial, subida de archivos).
- Página de **Alertas**.
- Páginas de **Administración** (usuarios, dependencias).
- Página de **Reportes**.

## Cómo correr localmente

```bash
cp .env.example .env.local
```

Ajusta `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
NEXT_PUBLIC_TENANT_DOMAIN=alcaldiadefunza.gov.co
```

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

> Nota: este código se generó sin poder correr `npm run build` con todas las
> dependencias reales en este entorno (sí se verificó que el registro de npm
> es alcanzable, pero no se instalaron todas las dependencias de Next/MUI
> para una compilación completa). Al bajarlo, corre `npm install && npm run
> build` como primer paso para atrapar cualquier detalle menor de tipado o
> de versión.

## Notas sobre el login en desarrollo

Como el login real requiere un `GOOGLE_CLIENT_ID` configurado y un dominio
autorizado en Google Cloud Console, para probar las pantallas protegidas
sin pasar por Google puedes:

1. Generar un JWT de prueba con `herramientas-prueba/generar-token-prueba.js`
   (de la fase de pruebas del backend).
2. En las DevTools del navegador, ejecutar:
   ```js
   localStorage.setItem('sigpa_token', 'TU_TOKEN_AQUI');
   localStorage.setItem('sigpa_usuario', JSON.stringify({
     id: 1, organization_id: 1, email: 'admin@alcaldiadefunza.gov.co',
     nombre: 'Admin de Prueba', rol_nombre: 'Administrador', activo: true
   }));
   ```
3. Recargar la página — debería entrar directo al dashboard sin pasar por Google.
