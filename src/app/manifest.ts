import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bingo Show TV',
    short_name: 'Bingo Show',
    description: 'Bingo Show TV',
    start_url: '/tv',
    display: 'standalone',
    orientation: 'landscape',
    background_color: '#060A14',
    theme_color: '#060A14',
    scope: '/',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
