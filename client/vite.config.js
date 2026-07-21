import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@components': path.resolve(__dirname, './src/components'),
            '@pages': path.resolve(__dirname, './src/pages'),
            '@layouts': path.resolve(__dirname, './src/layouts'),
            '@services': path.resolve(__dirname, './src/shared/services'),
            '@domains': path.resolve(__dirname, './src/domains'),
            '@styles': path.resolve(__dirname, './src/styles'),
            '@config': path.resolve(__dirname, './src/config'),
            '@constants': path.resolve(__dirname, './src/constants'),
            '@hooks': path.resolve(__dirname, './src/hooks'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@shared': path.resolve(__dirname, './src/shared')
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('scheduler') || id.includes('react-router')) {
                            return 'vendor-react';
                        }
                        if (id.includes('lucide-react')) {
                            return 'vendor-icons';
                        }
                        if (id.includes('socket.io')) {
                            return 'vendor-socket';
                        }
                        return 'vendor-core';
                    }
                }
            }
        }
    }
})