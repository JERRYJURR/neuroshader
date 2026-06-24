import { BloomEffect } from 'postprocessing'
import type { PassEffectManifest } from '../../types'

export const bloom = {
  type: 'bloom',
  layer: 'blurGlow',
  kind: 'pass',
  label: 'Bloom',
  params: {
    intensity: { type: 'number', label: 'Intensity', min: 0, max: 3, step: 0.05, default: 1.1 },
    threshold: { type: 'number', label: 'Threshold', min: 0, max: 1, step: 0.01, default: 0.2 },
    radius: { type: 'number', label: 'Radius', min: 0, max: 1, step: 0.01, default: 0.6 },
  },
  createEffect: (p) =>
    new BloomEffect({
      intensity: p.intensity as number,
      luminanceThreshold: p.threshold as number,
      luminanceSmoothing: 0.2,
      radius: p.radius as number,
      mipmapBlur: true,
    }),
  updateEffect: (effect, p) => {
    const e = effect as BloomEffect
    if (typeof p.intensity === 'number') e.intensity = p.intensity
    if (typeof p.threshold === 'number') e.luminanceMaterial.threshold = p.threshold
    if (typeof p.radius === 'number') e.mipmapBlurPass.radius = p.radius
  },
} satisfies PassEffectManifest
