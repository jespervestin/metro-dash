import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api/sl': {
        target: 'https://transport.integration.sl.se',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sl/, ''),
      },
      '/api/calendar.ics': {
        target: 'https://calendar.google.com',
        changeOrigin: true,
        rewrite: () => {
          // Extract path from VITE_CALENDAR_ICAL_URL env var
          const url = process.env.VITE_CALENDAR_ICAL_URL;
          if (!url) {
            throw new Error('VITE_CALENDAR_ICAL_URL environment variable is required. Create a .env.local file.');
          }
          try {
            const parsed = new URL(url);
            return parsed.pathname + parsed.search;
          } catch {
            // If it's already a path, use as-is
            return url.startsWith('/') ? url : '/' + url;
          }
        },
      },
    },
  },
})
