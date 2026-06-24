import { BloomEffect, KernelSize } from 'postprocessing'
import type { PassEffectManifest } from '../../types'

// Cheaper, harder-edged bloom (Gaussian kernel, no mipmap chain).
export const fastBloom = {
  type: 'fastBloom',
  layer: 'blurGlow',
  kind: 'pass',
  label: 'Fast Bloom',
  params: {
    intensity: { type: 'number', label: 'Intensity', min: 0, max: 3, step: 0.05, default: 1 },
    threshold: { type: 'number', label: 'Threshold', min: 0, max: 1, step: 0.01, default: 0.3 },
  },
  createEffect: (p) =>
    new BloomEffect({
      intensity: p.intensity as number,
      luminanceThreshold: p.threshold as number,
      luminanceSmoothing: 0.1,
      mipmapBlur: false,
      kernelSize: KernelSize.SMALL,
    }),
  updateEffect: (effect, p) => {
    const e = effect as BloomEffect
    if (typeof p.intensity === 'number') e.intensity = p.intensity
    if (typeof p.threshold === 'number') e.luminanceMaterial.threshold = p.threshold
  },
} satisfies PassEffectManifest
