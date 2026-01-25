import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split large dependencies
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'vendor-framer';
            if (id.includes('react-dom')) return 'vendor-react';
            if (id.includes('chart')) return 'vendor-charts';
            if (id.includes('plotly')) return 'vendor-plotly';
            return 'vendor-other';
          }

          // Split pages
          if (id.includes('pages/SettingsPage')) return 'page-settings';
          if (id.includes('pages/CampaignsPage')) return 'page-campaigns';
          if (id.includes('pages/ExtractPage')) return 'page-extract';
          if (id.includes('pages/LiveSessionPage')) return 'page-live';

          // Split heavy components
          if (id.includes('DNAProfileCard')) return 'component-dna';
          if (id.includes('RadarChart')) return 'component-radar';
          if (id.includes('mediaGenerationService')) return 'service-media';
        }
      }
    },
    chunkSizeWarningLimit: 600,
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    }
  }
});
