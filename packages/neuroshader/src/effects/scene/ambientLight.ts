import { AmbientLight, Color } from 'three'
import type { SceneEffectManifest } from '../../types'

export const ambientLight = {
  type: 'ambientLight',
  layer: 'scene',
  kind: 'scene',
  label: 'Ambient Light',
  params: {
    color: { type: 'color', label: 'Color', default: '#152a33' },
    intensity: { type: 'number', label: 'Intensity', min: 0, max: 4, step: 0.05, default: 1.2 },
  },
  create(ctx, p) {
    const light = new AmbientLight(new Color(p.color as string), p.intensity as number)
    ctx.scene.add(light)
    return {
      dispose: () => {
        ctx.scene.remove(light)
        light.dispose()
      },
    }
  },
} satisfies SceneEffectManifest
