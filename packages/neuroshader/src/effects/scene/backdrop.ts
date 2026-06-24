import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  MeshStandardMaterial,
} from 'three'
import type { SceneEffectManifest } from '../../types'

/**
 * An "infinity cove" backdrop: a flat floor that curves up into a vertical back
 * wall (like a photo-studio cyclorama), so the object reads as sitting in a lit
 * space. The surface responds to scene lights and receives shadows.
 */
function makeCoveGeometry(
  width: number,
  floorFront: number,
  curveStart: number,
  radius: number,
  wallHeight: number,
  arcSegments = 24,
): BufferGeometry {
  // Side profile in the Z–Y plane, front (toward camera) to back wall.
  const profile: Array<[number, number]> = [
    [floorFront, 0],
    [curveStart, 0],
  ]
  for (let i = 1; i <= arcSegments; i++) {
    const a = -Math.PI / 2 - (Math.PI / 2) * (i / arcSegments)
    profile.push([curveStart + radius * Math.cos(a), radius + radius * Math.sin(a)])
  }
  profile.push([curveStart - radius, wallHeight])

  const rows = profile.length
  const cols = 2
  const positions: number[] = []
  const uvs: number[] = []
  for (let r = 0; r < rows; r++) {
    const [z, y] = profile[r]
    for (let c = 0; c < cols; c++) {
      positions.push(-width / 2 + width * c, y, z)
      uvs.push(c, r / (rows - 1))
    }
  }
  const indices: number[] = []
  for (let r = 0; r < rows - 1; r++) {
    const base = r * cols
    indices.push(base, base + 1, base + cols, base + 1, base + cols + 1, base + cols)
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

export const backdrop = {
  type: 'backdrop',
  layer: 'scene',
  kind: 'scene',
  label: 'Backdrop',
  params: {
    color: { type: 'color', label: 'Color', default: '#0c1a20' },
    roughness: { type: 'number', label: 'Roughness', min: 0, max: 1, step: 0.01, default: 0.8 },
    metalness: { type: 'number', label: 'Metalness', min: 0, max: 1, step: 0.01, default: 0.1 },
    height: { type: 'number', label: 'Height', min: -4, max: 2, step: 0.05, default: -1.4 },
  },
  create(ctx, p) {
    const geometry = makeCoveGeometry(40, 14, -3, 6, 20)
    const material = new MeshStandardMaterial({
      color: new Color(p.color as string),
      roughness: p.roughness as number,
      metalness: p.metalness as number,
      side: DoubleSide,
    })
    const mesh = new Mesh(geometry, material)
    mesh.position.y = p.height as number
    mesh.receiveShadow = true
    ctx.scene.add(mesh)
    return {
      setParams: (params) => {
        if (typeof params.color === 'string') material.color.set(params.color)
        if (typeof params.roughness === 'number') material.roughness = params.roughness
        if (typeof params.metalness === 'number') material.metalness = params.metalness
        if (typeof params.height === 'number') mesh.position.y = params.height
        return true
      },
      dispose: () => {
        ctx.scene.remove(mesh)
        geometry.dispose()
        material.dispose()
      },
    }
  },
} satisfies SceneEffectManifest
