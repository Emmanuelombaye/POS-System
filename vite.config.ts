import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173,
      clientPort: 5173,
    },
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    // Enable source maps for debugging
    sourcemap: false,
    
    // Aggressive minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },

    // Rollup options for optimal chunking
    rollupOptions: {
      output: {
        // Cache busting: Add hash to all assets
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        
        // Optimize chunks
        manualChunks: {
          // Split vendor libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'recharts', 'lucide-react'],
          'vendor-state': ['zustand'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },

    // CSS optimization
    cssCodeSplit: true,
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
});

