import { createNeuroShader, defaultPreset } from '../src'

const app = document.getElementById('app')
if (!app) throw new Error('#app element not found')

const ns = createNeuroShader(app, defaultPreset)
ns.start()

// Expose for poking around in devtools.
;(window as unknown as { ns: typeof ns }).ns = ns
