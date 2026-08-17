import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      /**
       * `prompt`, not `autoUpdate`: a new service worker taking over reloads the
       * page, and people here are usually mid-way through typing an expense.
       * InstallPrompt renders the "reload now" affordance instead — without it a
       * waiting worker would sit there forever and updates would never land.
       */
      registerType: 'prompt',
      // No `includeAssets`: the globPatterns below already sweep every image in
      // public/, and listing them twice just duplicates precache entries.

      manifest: {
        id: '/',
        name: 'Group Travel — split trip costs',
        short_name: 'Group Travel',
        description:
          'Track group trip expenses and settle up. Works offline, data stays on your device.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'any',
        theme_color: '#4f46e5',
        background_color: '#f4f5fb',
        categories: ['finance', 'travel', 'productivity'],
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        /**
         * The whole point of the exercise: client-side routes like /trip/<id>
         * have no file behind them, so an offline navigation has to be answered
         * from the precached shell.
         */
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // The app makes no network requests at all, so there is nothing to
        // runtime-cache — every asset it needs is in the precache above.
        runtimeCaching: [],
      },
    }),
  ],
});
