import { Color, DirectionalLight } from 'three'
import type { SceneEffectManifest } from '../../types'

export const directionalLight = {
  type: 'directionalLight',
  layer: 'scene',
  kind: 'scene',
  label: 'Directional Light',
  params: {
    color: { type: 'color', label: 'Color', default: '#8fdfff' },
    intensity: { type: 'number', label: 'Intensity', min: 0, max: 6, step: 0.1, default: 3 },
    position: { type: 'vec3', label: 'Position', default: [4, 6, 5] },
    castShadow: { type: 'boolean', label: 'Cast Shadow', default: true },
  },
  create(ctx, p) {
    const light = new DirectionalLight(new Color(p.color as string), p.intensity as number)
    const [x, y, z] = p.position as [number, number, number]
    light.position.set(x, y, z)

    if (p.castShadow as boolean) {
      light.castShadow = true
      light.shadow.mapSize.set(2048, 2048)
      light.shadow.normalBias = 0.02
      light.shadow.camera.near = 1
      light.shadow.camera.far = 30
      const cam = light.shadow.camera
      cam.left = -8
      cam.right = 8
      cam.top = 8
      cam.bottom = -8
      cam.updateProjectionMatrix()
    }

    ctx.scene.add(light)
    return {
      setParams: (params) => {
        // Toggling shadows needs a rebuild to (re)configure the shadow camera.
        if ('castShadow' in params) return false
        if (typeof params.color === 'string') light.color.set(params.color)
        if (typeof params.intensity === 'number') light.intensity = params.intensity
        if (Array.isArray(params.position)) {
          const [nx, ny, nz] = params.position as [number, number, number]
          light.position.set(nx, ny, nz)
        }
        return true
      },
      dispose: () => {
        ctx.scene.remove(light)
        light.dispose()
      },
    }
  },
} satisfies SceneEffectManifest
