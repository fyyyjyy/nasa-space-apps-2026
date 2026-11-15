import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the built site runs from any path on static hosting.
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Three.js in its own long-lived chunk; the quiz dialog stays a lazy dynamic import.
        manualChunks(id) {
          if (id.includes('node_modules/three/')) return 'three';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js', 'src/**/*.test.js'],
  },
});
