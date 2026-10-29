import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Школьная Планёрка — Кабинет Администрации',
        short_name: 'Планёрка',
        description: 'Административное приложение управления школой, планёрками, поручениями и сбором отчетов.',
        theme_color: '#1e293b',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=192&auto=format&fit=crop&q=60',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=512&auto=format&fit=crop&q=60',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
