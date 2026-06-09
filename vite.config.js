import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  // Target old WebView (Fully Kiosk on a hacked Storytel Reader: Android 6 /
  // Chrome 53). That WebView has no ES module support, so plugin-legacy emits a
  // SystemJS + ES5 bundle with polyfills that it loads via nomodule. The legacy
  // browser range is controlled by the plugin's `targets` below.
  plugins: [
    react(),
    legacy({
      targets: ['android >= 6', 'chrome >= 53'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),
  ],
  server: {
    host: true,
    proxy: {
      '/api/sl': {
        target: 'https://transport.integration.sl.se',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sl/, ''),
      },
      '/api/weather': {
        target: 'https://api.open-meteo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/weather/, ''),
      },
      '/api/calendar': {
        target: 'https://calendar.google.com',
        changeOrigin: true,
        rewrite: () => {
          const url = process.env.VITE_CALENDAR_ICAL_URL;
          if (!url) return '/'; // Will 404 gracefully; set VITE_CALENDAR_ICAL_URL in .env.local
          try {
            const parsed = new URL(url);
            return parsed.pathname + parsed.search;
          } catch {
            return url.startsWith('/') ? url : '/' + url;
          }
        },
      },
    },
  },
})
