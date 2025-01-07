import { defineConfig } from 'vite'
import dtsPlugin from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dtsPlugin({
      insertTypesEntry: true,
      include: ['src'],
      rollupTypes: true
    })
  ],
  esbuild: {
    minifyIdentifiers: false // 禁止压缩标识符（类名、变量名等）
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/index.ts',
      name: 'CssInJs',
      fileName: (format) => `css-in-js.${format}.js`,
      formats: ['es', 'umd']
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
