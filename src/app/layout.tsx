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

import { Barlow_Condensed, Inter } from 'next/font/google';
import { ThemeProvider } from '@/contexts/ThemeContext';

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${barlowCondensed.variable} ${inter.variable}`}>
      <body>
        <ThemeProvider>
          <PwaRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

