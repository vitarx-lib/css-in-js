import { defineConfig } from 'vite'
import dtsPlugin from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dtsPlugin({
      include: ['src'],
      insertTypesEntry: true,
      rollupTypes: true
    })
  ],
  esbuild: {
    minifyIdentifiers: false // 禁止压缩标识符（类名、变量名等）
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'CssInJs',
      fileName: (format) => `css-in-js.${format}.js`,
      formats: ['es', 'iife']
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
