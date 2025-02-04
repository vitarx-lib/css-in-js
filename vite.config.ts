import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    minifyIdentifiers: false // 禁止压缩标识符（类名、变量名等）
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'CssInJs',
      fileName: (format) => `css-in-js.${format}.js`,
      formats: ['umd']
    },
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
