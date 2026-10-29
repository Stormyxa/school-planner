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
        name: 'КГУ «СШ № 43» — Школьная Планёрка',
        short_name: 'СШ № 43',
        description: 'Административное приложение управления КГУ «СШ № 43»: планёрки, СОР/СОЧ, поручения директора и архив отчетов.',
        theme_color: '#0284c7',
        background_color: '#0f172a',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        start_url: '/',
        scope: '/',
        id: 'school-planner-kgu43',
        categories: ['education', 'productivity', 'business'],
        shortcuts: [
          {
            name: 'Тапсырмалар / Поручения',
            short_name: 'Поручения',
            url: '/',
            icons: [{ src: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=192&auto=format&fit=crop&q=60', sizes: '192x192' }]
          },
          {
            name: 'Планёрка / Кездесулер',
            short_name: 'Планёрка',
            url: '/',
            icons: [{ src: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=192&auto=format&fit=crop&q=60', sizes: '192x192' }]
          }
        ],
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
