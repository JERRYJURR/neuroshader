import { DepthOfFieldEffect } from 'postprocessing'
import type { PassEffectManifest } from '../../types'

// Real depth-based DoF (uses the scene depth the RenderPass provides).
export const depthOfField = {
  type: 'depthOfField',
  layer: 'blurGlow',
  kind: 'pass',
  label: 'Depth of Field',
  params: {
    focusDistance: { type: 'number', label: 'Focus', min: 0, max: 1, step: 0.001, default: 0.03 },
    focalLength: { type: 'number', label: 'Focal Length', min: 0, max: 1, step: 0.001, default: 0.06 },
    bokehScale: { type: 'number', label: 'Bokeh', min: 0, max: 10, step: 0.1, default: 3 },
  },
  createEffect: (p, ctx) =>
    new DepthOfFieldEffect(ctx.camera, {
      focusDistance: p.focusDistance as number,
      focalLength: p.focalLength as number,
      bokehScale: p.bokehScale as number,
    }),
  updateEffect: (effect, p) => {
    const e = effect as DepthOfFieldEffect
    // Focus changes rebuild the CoC pass; bokeh scale is live.
    if ('focusDistance' in p || 'focalLength' in p) return false
    if (typeof p.bokehScale === 'number') e.bokehScale = p.bokehScale
    return true
  },
} satisfies PassEffectManifest
