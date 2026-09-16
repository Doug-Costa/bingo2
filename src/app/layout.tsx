import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { PwaRegister } from '@/components/PwaRegister';

export const metadata: Metadata = {
  title: 'Bingo Show TV',
  description: 'Bingo Show TV',
  manifest: '/manifest.webmanifest',
};

// App de TV: sem pinch-zoom, sem escala inicial diferente de 1 — o
// dimensionamento real é feito pelo TvViewport/TvStage via JS, não pelo
// navegador.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#060A14',
};

import { ThemeProvider } from '@/contexts/ThemeContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <ThemeProvider>
          <PwaRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

