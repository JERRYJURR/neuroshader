import { Effect } from 'postprocessing'
import { Uniform } from 'three'
import type { ParamValues, PassEffectManifest } from '../../types'

const fragmentShader = /* glsl */ `
uniform float strength;
void mainUv(inout vec2 uv) {
  vec2 c = uv - 0.5;
  float r2 = dot(c, c);
  uv = 0.5 + c * (1.0 + strength * r2);
}
`

class LensDistortEffect extends Effect {
  private readonly uStrength: Uniform<number>

  constructor(strength: number) {
    const uStrength = new Uniform(strength)
    super('LensDistortEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([['strength', uStrength]]),
    })
    this.uStrength = uStrength
  }

  applyParams(params: ParamValues): void {
    if (typeof params.strength === 'number') this.uStrength.value = params.strength
  }
}

export const lensDistort = {
  type: 'lensDistort',
  layer: 'distortion',
  kind: 'pass',
  label: 'Lens Distort',
  params: {
    strength: { type: 'number', label: 'Strength', min: -1, max: 1, step: 0.01, default: 0.35 },
  },
  createEffect: (p) => new LensDistortEffect(p.strength as number),
  updateEffect: (effect, p) => {
    ;(effect as LensDistortEffect).applyParams(p)
  },
} satisfies PassEffectManifest
