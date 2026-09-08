import type { Metadata } from 'next';
import ThemeRegistry from '@/components/theme-registry';
import { AuthProvider } from '@/contexts/auth-context';

export const metadata: Metadata = {
  title: 'SIGPA — Gestión del Parque Automotor',
  description: 'Sistema Integral de Gestión del Parque Automotor y Control de Vencimientos Documentales para la Alcaldía de Funza.',
  applicationName: 'SIGPA',
  keywords: ['parque automotor', 'vehículos', 'alcaldía', 'funza', 'gestión', 'SOAT', 'documentos'],
  authors: [{ name: 'Alcaldía de Funza' }],
  themeColor: '#DA151C',
  colorScheme: 'light dark',
  openGraph: {
    title: 'SIGPA — Gestión del Parque Automotor',
    description: 'Sistema Integral de Gestión del Parque Automotor',
    siteName: 'SIGPA',
    locale: 'es_CO',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeRegistry>
          <AuthProvider>{children}</AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
