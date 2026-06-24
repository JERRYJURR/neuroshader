import { Effect, EffectPass } from 'postprocessing'
import { Uniform } from 'three'
import type { PassEffectManifest } from '../../types'

const fragmentShader = /* glsl */ `
uniform float strength;
void mainUv(inout vec2 uv) {
  vec2 c = uv - 0.5;
  float r2 = dot(c, c);
  uv = 0.5 + c * (1.0 + strength * r2);
}
`

class LensDistortEffect extends Effect {
  constructor(strength: number) {
    super('LensDistortEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([['strength', new Uniform(strength)]]),
    })
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
  createPass: (p, ctx) =>
    new EffectPass(ctx.camera, new LensDistortEffect(p.strength as number)),
} satisfies PassEffectManifest
