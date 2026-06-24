import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Alias the library to its source so editing the runtime hot-reloads the editor
// (and the editor truly dogfoods the same engine it ships).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      neuroshader: fileURLToPath(
        new URL('../../packages/neuroshader/src/index.ts', import.meta.url),
      ),
    },
    dedupe: ['three', 'postprocessing'],
  },
})
