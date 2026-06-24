# neuroshader

> Author sci-fi, neuro-distorted WebGL effects visually — render them anywhere.

**neuroshader** is two things sharing one engine:

- **`neuroshader`** (`packages/neuroshader`) — a framework-agnostic WebGL runtime built on Three.js + [`postprocessing`](https://github.com/pmndrs/postprocessing). You feed it a tiny declarative config and it renders a layered effect on a canvas.
- **studio** (`apps/studio`) — a visual editor that authors that config: a layers panel, per-effect inspector, presets, and one-click export. *(coming in M3+)*

The editor renders its live preview using the **exact same** runtime the library ships, so what you see is what `npm install neuroshader` produces. The export is just the config.

## The model

Six layers, fixed order, reorder effects within each:

| # | Layer | Kind | Examples |
|---|-------|------|----------|
| 1 | `scene` | 3D scene | lighting, shadows, fog, background image |
| 2 | `object` | 3D scene | 3D model / primitive, SVG extrusion, image/video |
| 3 | `distortion` | screen-space pass | ripple, swirl, waves, lens distort, warp, mouse trail |
| 4 | `filter` | screen-space pass | solarize, posterize, threshold, find edges |
| 5 | `blurGlow` | screen-space pass | blur, DoF, bloom, motion blur |
| 6 | `post` | screen-space pass | noise, dithering, gradient map, color overlay, glitch |

Layers 1–2 build a Three.js scene; layers 3–6 compile to an ordered `EffectComposer` chain.

## Usage (target API)

```bash
npm install neuroshader
```

```ts
import { createNeuroShader } from 'neuroshader'
import config from './my-export.json'

const ns = createNeuroShader(document.querySelector('#canvas'), config)
ns.start()
```

## Develop

```bash
pnpm install
pnpm dev         # runtime playground (rotating-cube bootstrap scene)
pnpm build       # build all packages
pnpm typecheck   # typecheck all packages
```

## Status

Early. Current milestone: **M1** — runtime core renders a bootstrap scene. See the build roadmap (M0–M6) in project notes.

## License

MIT © Jerry Kou
