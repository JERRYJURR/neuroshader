import { Color } from 'three'
import type { SceneEffectManifest } from '../../types'

/** Sets the scene's clear/void color — the flat color behind all geometry. */
export const background = {
  type: 'background',
  layer: 'scene',
  kind: 'scene',
  label: 'Background',
  params: {
    color: { type: 'color', label: 'Color', default: '#05070a' },
  },
  create(ctx, p) {
    ctx.scene.background = new Color(p.color as string)
    return {
      setParams: (params) => {
        if (typeof params.color === 'string') {
          ctx.scene.background = new Color(params.color)
        }
      },
    }
  },
} satisfies SceneEffectManifest
