
# SIGPA - Base de Conocimiento Técnica

## Stack Definitivo

- Backend: Go + Gin
- Base de Datos: SQL Server
- Frontend: React/Next.js + TypeScript
- UI: Material UI (inspirado en el prototipo v0)
- Gráficos: Recharts
- OAuth: Google Workspace
- Alertas: Gmail API

## Justificación de SQL Server

SIGAL ya se encuentra en producción utilizando Go + Gin + SQL Server. Mantener el mismo motor permitirá:

- Reutilizar patrones y utilidades existentes.
- Compartir infraestructura institucional.
- Reducir tiempos de despliegue.
- Facilitar soporte y mantenimiento.
- Unificar conocimientos del equipo.

## Branding

- Primario: #C62828
- Primario oscuro: #B71C1C
- Secundario: #D32F2F
- Fondo: #212121
- Gris: #424242
- Gris claro: #757575

## Pantallas Principales

- Login
- Dashboard Ejecutivo
- Gestión de Vehículos
- Detalle de Vehículo
- Gestión Documental
- Alertas
- Reportes
- Administración

## Páginas detectadas

- app/page.tsx
- components/pages/admin-page.tsx
- components/pages/alerts-page.tsx
- components/pages/dashboard-page.tsx
- components/pages/documents-page.tsx
- components/pages/login-page.tsx
- components/pages/reports-page.tsx
- components/pages/vehicle-detail-page.tsx
- components/pages/vehicles-page.tsx

## Componentes detectados

- components/layout/app-shell.tsx
- components/layout/sidebar.tsx
- components/layout/topbar.tsx
- components/pages/admin-page.tsx
- components/pages/alerts-page.tsx
- components/pages/dashboard-page.tsx
- components/pages/documents-page.tsx
- components/pages/login-page.tsx
- components/pages/reports-page.tsx
- components/pages/vehicle-detail-page.tsx
- components/pages/vehicles-page.tsx
- components/ui/button.tsx
- components/ui/status-badge.tsx

## Componentes Clave

### Dashboard
- KPIs
- Tarjetas
- Gráficos
- Timeline
- Centro de alertas

### Vehículos
- CRUD
- Filtros
- Exportación
- Paginación

### Documentos
- SOAT
- Tecnomecánica
- Pólizas
- Tarjeta de propiedad

### Alertas
- Próximos vencimientos
- Notificaciones
- Correos

## Arquitectura Objetivo

```text
Frontend (Next/React)
        ↓
API REST (Go + Gin)
        ↓
Services
        ↓
Repositories
        ↓
SQL Server
        ↓
Google APIs
```

## Multi-Tenant

Todas las tablas incluirán `organization_id`.

Ejemplos:
- Alcaldía de Funza
- Alcaldía de Mosquera
- Alcaldía de Madrid

## Roadmap

1. Base de datos SQL Server.
2. Backend Go.
3. Autenticación.
4. Dashboard.
5. Vehículos.
6. Documentos.
7. Alertas.
8. Migración Excel.
9. Docker.
10. Producción.

## Conclusión

El prototipo representa aproximadamente el 60% del trabajo visual. Se mantendrá la experiencia de usuario y se reemplazarán progresivamente los datos simulados por servicios reales.

Se desarrollo un prototipo en vercel este es el link del prototipo. https://v0.app/dhernande1983-5827/chat/sigpa-prototype-m8Fed0kPKaK por eso salieron esas paginas que mencione.
la idea es usar este prototipo e ir construyendo paso a paso tanto base de datos aca se espera los scripts para correr en sql luego backend (aca se espera la estructura de backend en go con todos sus componentes) la estructura Frontend e react con todos sus componentes,

