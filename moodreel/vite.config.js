import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

const analyze = process.env.ANALYZE === '1';

export default defineConfig(({ mode }) => {
  // Read TMDB key from .env files for the dev proxy. Vite's `import.meta.env`
  // only exposes these to the client bundle; for the Node-side proxy config
  // we need to load them explicitly.
  const env = loadEnv(mode, process.cwd(), '');
  const tmdbApiKey = env.TMDB_API_KEY || env.VITE_TMDB_API_KEY || env.REACT_APP_TMDB_API_KEY || '';
  const tmdbBase = env.VITE_TMDB_BASE_URL || 'https://api.themoviedb.org/3';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.themoviedb\.org\/.*/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'tmdb-images',
                expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
              },
            },
          ],
        },
        manifest: {
          name: 'MoodReel',
          short_name: 'MoodReel',
          description: 'Discover movies and TV shows that match your mood.',
          theme_color: '#09090b',
          background_color: '#09090b',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui'],
          scope: '/',
          start_url: '/',
          lang: 'en',
          categories: ['entertainment', 'movies', 'utilities'],
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: '/maskable-icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
      ...(analyze
        ? [
            visualizer({
              filename: path.resolve(__dirname, 'build/stats.html'),
              gzipSize: true,
              open: false,
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        // Mirror the Vercel `moodreel/api/tmdb.js` proxy in dev so the app
        // doesn't need CSP carve-outs for api.themoviedb.org. The proxy
        // extracts the upstream path from the `path` query param, strips
        // any client-supplied api_key, and forwards with the server-side
        // key.
        '/api/tmdb': {
          target: tmdbBase,
          changeOrigin: true,
          secure: true,
          rewrite: path => {
            // /api/tmdb?path=/trending/all/day&api_key=...&foo=bar
            //   -> /trending/all/day?api_key=<server-side>&foo=bar
            const url = new URL(path, 'http://localhost');
            const upstreamPath = url.searchParams.get('path') || '/';
            url.searchParams.delete('api_key');
            url.searchParams.delete('path');
            if (tmdbApiKey) {
              url.searchParams.set('api_key', tmdbApiKey);
            }
            return upstreamPath + (url.search || '');
          },
        },
        // /api/og-vibe is a Vercel serverless function in production.
        // In dev there's no equivalent, so we just let Vite 404 — the
        // app still works, the OG image preview just isn't dynamic.
        // The static /og_preview.png fallback is still served from
        // public/ as before.
      },
    },
    build: {
      outDir: 'build',
      sourcemap: false,
      target: 'es2020',
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react-dom')) return 'vendor';
            if (id.includes('node_modules/react')) return 'vendor';
            if (id.includes('node_modules/react-router')) return 'router';
            if (id.includes('node_modules/axios')) return 'data';
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.js'],
      include: ['src/**/*.{test,spec}.{js,jsx}'],
      css: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: ['src/**/*.{js,jsx}'],
      },
    },
  };
});
