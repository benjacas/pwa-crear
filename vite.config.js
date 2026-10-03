import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'CREAR — Portal de Familias',
        short_name: 'CREAR',
        description: 'Portal de autogestión para familias de la Escuela de Danzas CREAR',
        theme_color: '#6D5AE6',
        background_color: '#EEE9FF',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // cachear lo básico de la app; las llamadas a /api/v1/* nunca deben
        // cachearse — son datos en vivo (cuotas, asistencia), no assets estáticos
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
})
