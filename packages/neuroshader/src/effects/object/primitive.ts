import {
  BoxGeometry,
  Color,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusKnotGeometry,
} from 'three'
import type { BufferGeometry } from 'three'
import type { SceneEffectManifest } from '../../types'

function makeGeometry(shape: string, size: number): BufferGeometry {
  switch (shape) {
    case 'sphere':
      return new SphereGeometry(size * 0.7, 64, 64)
    case 'icosahedron':
      return new IcosahedronGeometry(size * 0.8, 0)
    case 'torusKnot':
      return new TorusKnotGeometry(size * 0.5, size * 0.18, 160, 32)
    case 'box':
    default:
      return new BoxGeometry(size, size, size)
  }
}

export const primitive = {
  type: 'primitive',
  layer: 'object',
  kind: 'scene',
  label: 'Primitive',
  params: {
    shape: {
      type: 'select',
      label: 'Shape',
      default: 'box',
      options: [
        { label: 'Box', value: 'box' },
        { label: 'Sphere', value: 'sphere' },
        { label: 'Icosahedron', value: 'icosahedron' },
        { label: 'Torus Knot', value: 'torusKnot' },
      ],
    },
    size: { type: 'number', label: 'Size', min: 0.2, max: 4, step: 0.05, default: 1.6 },
    color: { type: 'color', label: 'Color', default: '#0e2a33' },
    metalness: { type: 'number', label: 'Metalness', min: 0, max: 1, step: 0.01, default: 0.6 },
    roughness: { type: 'number', label: 'Roughness', min: 0, max: 1, step: 0.01, default: 0.25 },
    spinX: { type: 'number', label: 'Spin X', min: -2, max: 2, step: 0.01, default: 0.35 },
    spinY: { type: 'number', label: 'Spin Y', min: -2, max: 2, step: 0.01, default: 0.55 },
  },
  create(ctx, p) {
    const geometry = makeGeometry(p.shape as string, p.size as number)
    const material = new MeshStandardMaterial({
      color: new Color(p.color as string),
      metalness: p.metalness as number,
      roughness: p.roughness as number,
      emissive: new Color(0x07171c),
    })
    const mesh = new Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    ctx.scene.add(mesh)

    const spinX = p.spinX as number
    const spinY = p.spinY as number
    return {
      update: ({ delta }) => {
        mesh.rotation.x += delta * spinX
        mesh.rotation.y += delta * spinY
      },
      dispose: () => {
        ctx.scene.remove(mesh)
        geometry.dispose()
        material.dispose()
      },
    }
  },
} satisfies SceneEffectManifest
