'use client';

import { Box, Typography, Divider } from '@mui/material';
import { ReactNode } from 'react';

export default function ChartCard({
  titulo,
  children,
  altura = 280,
  acciones,
}: {
  titulo: string;
  children: ReactNode;
  altura?: number;
  acciones?: ReactNode;
}) {
  return (
    <Box
      sx={{
        height: '100%',
        bgcolor: 'background.paper',
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 2.5, py: 1.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.875rem', color: 'text.primary' }}>
          {titulo}
        </Typography>
        {acciones && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>{acciones}</Box>}
      </Box>
      <Divider />
      <Box sx={{ p: 2, width: '100%', height: altura }}>{children}</Box>
    </Box>
  );
}
