import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const isDashboardDev = process.env.PLANORA_DASHBOARD_DEV === '1';

export default defineConfig({
  plugins: isDashboardDev
    ? [
        {
          name: 'dashboard-fallback',
          configureServer(server) {
            server.middlewares.use((req, _res, next) => {
              const url = req.url || '/';
              // Serve dashboard.html for dashboard routes in dev mode
              if (
                url === '/' ||
                url.startsWith('/project/') ||
                url.startsWith('/settings')
              ) {
                req.url = '/dashboard.html';
              }
              next();
            });
          },
        },
      ]
    : [],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
      },
    },
  },
});
