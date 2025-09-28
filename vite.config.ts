
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'react';
              if (id.includes('@radix-ui')) return 'radix';
              if (id.includes('recharts')) return 'recharts';
              if (id.includes('@supabase')) return 'supabase';
              return 'vendor';
            }
          },
        },
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      open: false,
    },
  });
