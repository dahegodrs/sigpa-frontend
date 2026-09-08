'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Box, Button, Divider, Paper, Stack, Typography,
  TextField, Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api-client';

type BeneficioTipo = 'documentos' | 'alertas' | 'seguimiento';

const BENEFICIOS = [
  { tipo: 'documentos' as BeneficioTipo, title: 'Control total', text: 'de documentos y vencimientos' },
  { tipo: 'alertas' as BeneficioTipo, title: 'Alertas automáticas', text: 'antes de que algo venza' },
  { tipo: 'seguimiento' as BeneficioTipo, title: 'Información en tiempo real', text: 'para tomar mejores decisiones' },
];

export default function LoginPage() {
  const { loginConCredenciales } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Ingresa tu correo y contraseña'); return; }
    setCargando(true);
    setError(null);
    try {
      await loginConCredenciales(email.trim().toLowerCase(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F9F9FA', display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(490px, 52%) 1fr' } }}>
      {/* Panel izquierdo — identidad institucional */}
      <Box
        sx={{
          minHeight: { xs: 420, lg: '100vh' },
          overflow: 'hidden',
          position: 'relative',
          color: '#FFF',
          px: { xs: 3.5, sm: 6, xl: 8 },
          py: { xs: 4, sm: 6, xl: 7 },
          background: 'linear-gradient(120deg, #10171C 0%, #1B242A 42%, #84171C 100%)',
        }}
      >
        <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, opacity: 0.22, backgroundImage: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,.18) 30.2%, transparent 30.7%), repeating-linear-gradient(90deg, transparent 0 58px, rgba(255,255,255,.10) 59px 61px)', transform: 'skewX(-9deg) scale(1.15)', transformOrigin: 'bottom right' }} />
        <Box aria-hidden="true" sx={{ position: 'absolute', width: { xs: 520, lg: 720 }, height: { xs: 520, lg: 720 }, right: { xs: -390, lg: -460 }, top: { xs: -280, lg: -330 }, borderRadius: '50%', bgcolor: '#E52328', opacity: 0.97 }} />
        <Box aria-hidden="true" sx={{ position: 'absolute', width: 290, height: 290, right: { xs: -170, lg: -100 }, bottom: -120, border: '1px solid rgba(255,255,255,.35)', borderRadius: '50%', boxShadow: '0 0 0 45px rgba(255,255,255,.035), 0 0 0 90px rgba(255,255,255,.02)' }} />

        <Box sx={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ width: { xs: 240, sm: 280 }, bgcolor: '#FFF', borderRadius: 1.5, px: 1.2, py: 1, boxShadow: '0 8px 24px rgba(0,0,0,.18)' }}>
            <Image src="/logo-funza.png" alt="Alcaldía de Funza" width={984} height={326} priority style={{ display: 'block', width: '100%', height: 'auto' }} />
          </Box>

          <Box sx={{ mt: { xs: 6, lg: 9 }, maxWidth: 520 }}>
            <Box sx={{ width: 68, height: 6, borderRadius: 4, bgcolor: '#EE2C31', mb: 2.5 }} />
            <Typography component="h1" sx={{ fontSize: { xs: 48, sm: 64, xl: 76 }, lineHeight: .95, letterSpacing: '-.055em', fontWeight: 800, mb: 3 }}>
              SIGPA
            </Typography>
            <Typography sx={{ fontSize: { xs: 20, sm: 25 }, lineHeight: 1.35, fontWeight: 700, maxWidth: 430 }}>
              Sistema Integral de Gestión del Parque Automotor
            </Typography>
            <Typography sx={{ mt: 2.5, maxWidth: 410, color: 'rgba(255,255,255,.72)', fontSize: { xs: 15, sm: 17 }, lineHeight: 1.55 }}>
              Control inteligente y oportuno para una gestión eficiente del parque automotor.
            </Typography>
          </Box>

          <Stack spacing={2.1} sx={{ mt: 'auto', pt: 6, maxWidth: 355 }}>
            {BENEFICIOS.map((beneficio) => (
              <Stack key={beneficio.title} direction="row" spacing={2} alignItems="center">
                <BeneficioIcon tipo={beneficio.tipo} />
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{beneficio.title}</Typography>
                  <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,.68)' }}>{beneficio.text}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Panel derecho — formulario de ingreso */}
      <Box sx={{ position: 'relative', display: 'grid', placeItems: 'center', p: { xs: 3, sm: 6, xl: 8 }, overflow: 'hidden' }}>
        <Box aria-hidden="true" sx={{ position: 'absolute', top: 35, right: 40, width: 72, height: 72, backgroundImage: 'radial-gradient(#D72429 2px, transparent 3px)', backgroundSize: '18px 18px', opacity: .55 }} />

        <Paper elevation={0} sx={{ width: '100%', maxWidth: 540, position: 'relative', p: { xs: 4, sm: 5 }, borderRadius: 4, border: '1px solid rgba(27,31,35,.07)', boxShadow: '0 18px 42px rgba(22,29,31,.10)' }}>
          {/* Cabecera */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ width: 72, height: 72, mx: 'auto', mb: 2.5, borderRadius: '50%', display: 'grid', placeItems: 'center', position: 'relative', bgcolor: '#FDEBEC', color: '#D51F25', boxShadow: 'inset 0 0 0 8px rgba(255,255,255,.55)' }}>
              <DirectionsCarFilledOutlinedIcon sx={{ fontSize: 37 }} />
              <VerifiedRoundedIcon sx={{ position: 'absolute', right: -3, bottom: -3, fontSize: 22, color: '#FFFFFF', bgcolor: '#D51F25', borderRadius: '50%', p: '.1px', boxShadow: '0 3px 8px rgba(128,20,24,.28)' }} />
            </Box>
            <Typography component="h2" sx={{ color: '#171A1D', fontWeight: 800, fontSize: { xs: 26, sm: 30 }, letterSpacing: '-.04em' }}>
              Bienvenido a <Box component="span" sx={{ color: '#D92328' }}>SIGPA</Box>
            </Typography>
            <Typography sx={{ mt: 1, color: '#69717B', fontSize: 14 }}>
              Ingresa con tu cuenta institucional de la Alcaldía de Funza
            </Typography>
          </Box>

          {/* Formulario usuario/contraseña */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2}>
              {error && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                label="Correo institucional"
                type="email"
                fullWidth
                size="small"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                placeholder="usuario@alcaldia.gov.co"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                label="Contraseña"
                type={mostrarPassword ? 'text' : 'password'}
                fullWidth
                size="small"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setMostrarPassword(!mostrarPassword)} edge="end">
                        {mostrarPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={cargando}
                sx={{
                  height: 52,
                  bgcolor: '#D92328',
                  borderRadius: 2,
                  fontWeight: 750,
                  fontSize: 15,
                  boxShadow: '0 8px 16px rgba(191,28,33,.22)',
                  '&:hover': { bgcolor: '#B7191E', boxShadow: '0 10px 20px rgba(191,28,33,.28)' },
                  '&:disabled': { bgcolor: '#D92328', opacity: 0.65 },
                }}
              >
                {cargando ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Ingresar'}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.disabled" sx={{ px: 1 }}>o también</Typography>
          </Divider>

          {/* Botón Google (deshabilitado hasta configurar OAuth) */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            disabled
            sx={{ height: 48, borderRadius: 2, fontWeight: 600, fontSize: 14, borderColor: '#E0E0E0', color: '#5F6368' }}
          >
            Iniciar sesión con Google Workspace
          </Button>

          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 3, p: 1.5, bgcolor: '#F9FAFB', borderRadius: 2 }}>
            <ShieldOutlinedIcon sx={{ color: '#D92328', mt: '.1rem', flexShrink: 0 }} fontSize="small" />
            <Typography variant="caption" sx={{ color: '#707780', lineHeight: 1.6 }}>
              Acceso exclusivo para usuarios autorizados de la Alcaldía de Funza. Si no tienes contraseña configurada, contacta al administrador del sistema.
            </Typography>
          </Stack>
        </Paper>

        <Typography variant="caption" sx={{ mt: 2.5, color: '#8A9097', textAlign: 'center' }}>
          SIGPA · Alcaldía de Funza · Gestión documental segura
        </Typography>
      </Box>
    </Box>
  );
}

function BeneficioIcon({ tipo }: { tipo: BeneficioTipo }) {
  return (
    <Box sx={{ width: 48, height: 48, display: 'grid', placeItems: 'center', flexShrink: 0, borderRadius: 2, color: '#FF5357', bgcolor: 'rgba(255,255,255,.075)', border: '1px solid rgba(255,255,255,.13)' }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        {tipo === 'documentos' && (
          <>
            <path d="M8 3.75h8l4 4v15.5A1.75 1.75 0 0 1 18.25 25h-10.5A1.75 1.75 0 0 1 6 23.25v-17.5A1.75 1.75 0 0 1 7.75 4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M16 4v5h4M9.5 14h4M9.5 18h2.25M14.25 18l1.5 1.5 3-3.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {tipo === 'alertas' && (
          <>
            <path d="M8.25 20.25h11.5l-1.65-2.55v-5.05a4.1 4.1 0 0 0-8.2 0v5.05l-1.65 2.55Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.5 23a2.7 2.7 0 0 0 5 0M14 4.25v-1.5M5.75 8.25l1.3 1M22.25 8.25l-1.3 1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </>
        )}
        {tipo === 'seguimiento' && (
          <>
            <path d="M5 23V5.5M5 23h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="m8.5 18 4.25-4.25 3.1 2.45 5.15-6.45" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.5 9.75h2.5v2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </svg>
    </Box>
  );
}
