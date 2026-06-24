import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const resolvePath = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  build: {
    lib: {
      entry: resolvePath('./src/index.ts'),
      name: 'NeuroShader',
      fileName: 'neuroshader',
      formats: ['es', 'umd'],
    },
    sourcemap: true,
    rollupOptions: {
      // Keep three + postprocessing external so consumers dedupe a single copy.
      external: ['three', 'postprocessing'],
      output: {
        globals: {
          three: 'THREE',
          postprocessing: 'POSTPROCESSING',
        },
      },
    },
  },
  plugins: [
    dts({
      // Per-file declarations; dist/index.d.ts is the published types entry.
      include: ['src'],
    }),
  ],
})
