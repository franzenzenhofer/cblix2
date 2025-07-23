import { defineConfig } from 'vite';
import path from 'path';
import { execSync } from 'child_process';

// Get version and build info
const getVersionInfo = () => {
  try {
    const gitTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo "v2.0.0"')
      .toString()
      .trim()
      .replace('v', '');
    return gitTag;
  } catch {
    return '2.0.0';
  }
};

const version = getVersionInfo();
const buildDate = new Date().toISOString();

export default defineConfig({
  base: '/',
  root: '.',
  publicDir: 'public',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
    'import.meta.env.VITE_BUILD_DATE': JSON.stringify(buildDate),
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      input: './public/index.html',
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@engine': path.resolve(__dirname, './src/engine'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@plugins': path.resolve(__dirname, './src/plugins'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  },
  server: {
    port: 3000,
    open: true
  }
});