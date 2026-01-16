import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'lucide-react',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'firebase/database'
    ],
  },
  build: {
    commonjsOptions: {
      include: [/firebase/, /node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React vendor chunk - ensure React and React-DOM are together and loaded first
          // IMPORTANT: Include lucide-react and ALL React-dependent packages with React
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('lucide-react') ||
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/react-hook-form') ||
              // Include React-dependent scoped packages with React
              (id.includes('node_modules/@') && (
                id.includes('@radix-ui') ||
                id.includes('@tanstack') ||
                id.includes('@emotion') ||
                id.includes('@mui') ||
                id.includes('react-')
              ))) {
            return 'react-vendor';
          }
          // Firebase core chunk - IMPORTANT: Bundle ALL Firebase modules together to avoid initialization errors
          if (id.includes('firebase/') || id.includes('@firebase/')) {
            return 'firebase-core';
          }
          // XLSX library chunk (for Excel operations)
          if (id.includes('node_modules/xlsx')) {
            return 'xlsx-vendor';
          }
          // Date/time libraries chunk
          if (id.includes('node_modules/date-fns') || id.includes('node_modules/dayjs') || id.includes('node_modules/moment')) {
            return 'date-vendor';
          }
          // Note: recharts and react-hook-form are React-dependent, so they'll be caught by the React check above
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
            // Check if scoped package might depend on React (contains 'react' in path)
            // If it does, bundle with React to avoid createContext errors
            if (id.includes('node_modules/@')) {
              // Check if this scoped package uses React
              const isReactDependent = id.includes('react') || 
                                       id.includes('@radix-ui') ||
                                       id.includes('@tanstack') ||
                                       id.includes('@emotion') ||
                                       id.includes('@mui') ||
                                       id.includes('@headlessui') ||
                                       id.includes('@heroicons');
              
              if (isReactDependent) {
                return 'react-vendor';
              }
              // Non-React scoped packages go to vendor-scoped
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
