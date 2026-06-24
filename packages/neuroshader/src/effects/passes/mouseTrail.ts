import { Effect } from 'postprocessing'
import { Uniform, Vector2 } from 'three'
import type { ParamValues, PassEffectManifest } from '../../types'

// A lens-like bulge that follows the pointer. The pointer uniform is refreshed
// each frame from the live position the runtime tracks.
const fragmentShader = /* glsl */ `
uniform vec2 pointer;
uniform float strength;
uniform float radius;
void mainUv(inout vec2 uv) {
  vec2 d = uv - pointer;
  float dist = length(d);
  float f = exp(-(dist * dist) / (radius * radius));
  uv += normalize(d + 1e-6) * f * strength;
}
`

class MouseTrailEffect extends Effect {
  private readonly uPointer: Uniform<Vector2>
  private readonly uStrength: Uniform<number>
  private readonly uRadius: Uniform<number>
  private readonly pointerRef: Vector2

  constructor(strength: number, radius: number, pointerRef: Vector2) {
    const uPointer = new Uniform(pointerRef.clone())
    const uStrength = new Uniform(strength)
    const uRadius = new Uniform(radius)
    super('MouseTrailEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['pointer', uPointer],
        ['strength', uStrength],
        ['radius', uRadius],
      ]),
    })
    this.uPointer = uPointer
    this.uStrength = uStrength
    this.uRadius = uRadius
    this.pointerRef = pointerRef
  }

  // Per-frame hook: pull the latest pointer the runtime is tracking.
  override update(): void {
    this.uPointer.value.copy(this.pointerRef)
  }

  applyParams(p: ParamValues): void {
    if (typeof p.strength === 'number') this.uStrength.value = p.strength
    if (typeof p.radius === 'number') this.uRadius.value = p.radius
  }
}

export const mouseTrail = {
  type: 'mouseTrail',
  layer: 'distortion',
  kind: 'pass',
  label: 'Mouse Trail',
  params: {
    strength: { type: 'number', label: 'Strength', min: 0, max: 0.3, step: 0.005, default: 0.08 },
    radius: { type: 'number', label: 'Radius', min: 0.02, max: 0.6, step: 0.01, default: 0.18 },
  },
  createEffect: (p, ctx) =>
    new MouseTrailEffect(p.strength as number, p.radius as number, ctx.pointer),
  updateEffect: (effect, p) => {
    ;(effect as MouseTrailEffect).applyParams(p)
  },
} satisfies PassEffectManifest
