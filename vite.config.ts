import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// ponytail: no backend, no env vars; single SPA with app-shell PWA.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Where Money Gone',
        short_name: 'WMG',
        description: 'Snap receipts, track where your money goes.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // ponytail: cache Nominatim responses since users may go offline after first lookup.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/search/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'nominatim',
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
