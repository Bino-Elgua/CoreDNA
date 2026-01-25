import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', 'VITE_');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // BYOK Model: Never expose API keys to frontend
        // Users provide keys through Settings page
        // Keys stored in localStorage only
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              // Split large dependencies into separate chunks
              if (id.includes('node_modules')) {
                if (id.includes('framer-motion')) return 'vendor-framer';
                if (id.includes('react-dom')) return 'vendor-react';
                if (id.includes('chart')) return 'vendor-charts';
                if (id.includes('plotly')) return 'vendor-plotly';
                if (id.includes('@fortawesome')) return 'vendor-icons';
                if (id.includes('markdown') || id.includes('remark')) return 'vendor-markdown';
                return 'vendor-other';
              }

              // Split large pages into separate chunks (lazy loaded)
              if (id.includes('pages/SettingsPage')) return 'page-settings';
              if (id.includes('pages/CampaignsPage')) return 'page-campaigns';
              if (id.includes('pages/ExtractPage')) return 'page-extract';
              if (id.includes('pages/LiveSessionPage')) return 'page-live';

              // Split large components
              if (id.includes('DNAProfileCard')) return 'component-dna';
              if (id.includes('RadarChart')) return 'component-radar';
              if (id.includes('mediaGenerationService')) return 'service-media';
            }
          }
        },
        chunkSizeWarningLimit: 1000,
        minify: 'terser',
        terserOptions: {
          compress: { drop_console: true },
          format: { comments: false }
        }
      }
    };
});
