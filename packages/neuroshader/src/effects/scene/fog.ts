import { Color, Fog } from 'three'
import type { SceneEffectManifest } from '../../types'

// Linear distance fog — blends lit geometry toward a color with depth.
export const fog = {
  type: 'fog',
  layer: 'scene',
  kind: 'scene',
  label: 'Fog',
  params: {
    color: { type: 'color', label: 'Color', default: '#05070a' },
    near: { type: 'number', label: 'Near', min: 0, max: 30, step: 0.1, default: 3 },
    far: { type: 'number', label: 'Far', min: 1, max: 60, step: 0.5, default: 18 },
  },
  create(ctx, p) {
    const f = new Fog(new Color(p.color as string), p.near as number, p.far as number)
    ctx.scene.fog = f
    return {
      setParams: (params) => {
        if (typeof params.color === 'string') f.color.set(params.color)
        if (typeof params.near === 'number') f.near = params.near
        if (typeof params.far === 'number') f.far = params.far
      },
      dispose: () => {
        if (ctx.scene.fog === f) ctx.scene.fog = null
      },
    }
  },
} satisfies SceneEffectManifest
