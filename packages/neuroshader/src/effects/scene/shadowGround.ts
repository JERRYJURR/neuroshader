import { Mesh, PlaneGeometry, ShadowMaterial } from 'three'
import type { SceneEffectManifest } from '../../types'

export const shadowGround = {
  type: 'shadowGround',
  layer: 'scene',
  kind: 'scene',
  label: 'Shadow Ground',
  params: {
    opacity: { type: 'number', label: 'Opacity', min: 0, max: 1, step: 0.01, default: 0.55 },
    y: { type: 'number', label: 'Height', min: -5, max: 5, step: 0.1, default: -1.4 },
  },
  create(ctx, p) {
    const geometry = new PlaneGeometry(40, 40)
    const material = new ShadowMaterial({ opacity: p.opacity as number })
    const ground = new Mesh(geometry, material)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = p.y as number
    ground.receiveShadow = true
    ctx.scene.add(ground)
    return {
      dispose: () => {
        ctx.scene.remove(ground)
        geometry.dispose()
        material.dispose()
      },
    }
  },
} satisfies SceneEffectManifest
