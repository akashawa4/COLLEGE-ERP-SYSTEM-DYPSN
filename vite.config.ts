import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase core chunk
          if (id.includes('firebase/app') || id.includes('firebase/auth') || id.includes('firebase/firestore')) {
            return 'firebase-core';
          }
          // React vendor chunk
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // Icons chunk
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          // XLSX library chunk (for Excel operations)
          if (id.includes('node_modules/xlsx')) {
            return 'xlsx-vendor';
          }
          // Date/time libraries chunk
          if (id.includes('node_modules/date-fns') || id.includes('node_modules/dayjs') || id.includes('node_modules/moment')) {
            return 'date-vendor';
          }
          // UI/Form libraries chunk
          if (id.includes('node_modules/@radix-ui') || id.includes('node_modules/recharts') || id.includes('node_modules/react-hook-form')) {
            return 'ui-vendor';
          }
          // Admin components chunk
          if (id.includes('components/Admin')) {
            return 'admin-modules';
          }
          // Student management chunk
          if (id.includes('components/StudentManagement') || id.includes('components/StudentProfile')) {
            return 'student-modules';
          }
          // Teacher management chunk
          if (id.includes('components/TeacherManagement')) {
            return 'teacher-modules';
          }
          // Attendance chunk
          if (id.includes('components/Attendance')) {
            return 'attendance-modules';
          }
          // Results chunk
          if (id.includes('components/Results')) {
            return 'results-modules';
          }
          // Leave chunk
          if (id.includes('components/Leave')) {
            return 'leave-modules';
          }
          // Other vendor dependencies - split into smaller chunks
          if (id.includes('node_modules')) {
            // Split large vendor libraries into separate chunks
            if (id.includes('node_modules/@')) {
              return 'vendor-scoped';
            }
            // Keep remaining vendor in main vendor chunk
            return 'vendor';
          }
        },
      },
    },
    // Increase chunk size warning limit to 1000KB since we're splitting properly
    chunkSizeWarningLimit: 1000,
  },
});
