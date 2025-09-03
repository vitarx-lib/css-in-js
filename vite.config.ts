import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'CssInJs',
      fileName: (format) => `index.${format}.js`,
      formats: ['iife']
    },
    emptyOutDir: false,
    rollupOptions: {
      external: ['vitarx'],
      output: {
        globals: {
          vitarx: 'Vitarx'
        }
      }
    }
  }
})
