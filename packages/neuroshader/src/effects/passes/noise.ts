import { Effect, EffectPass } from 'postprocessing'
import { Uniform } from 'three'
import type { PassEffectManifest } from '../../types'

// `time` is a built-in postprocessing uniform, auto-updated each frame.
const fragmentShader = /* glsl */ `
uniform float amount;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float n = rand(uv + fract(time)) - 0.5;
  outputColor = vec4(inputColor.rgb + n * amount, inputColor.a);
}
`

class GrainEffect extends Effect {
  constructor(amount: number) {
    super('GrainEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([['amount', new Uniform(amount)]]),
    })
  }
}

export const noise = {
  type: 'noise',
  layer: 'post',
  kind: 'pass',
  label: 'Noise',
  params: {
    amount: { type: 'number', label: 'Amount', min: 0, max: 0.5, step: 0.005, default: 0.08 },
  },
  createPass: (p, ctx) =>
    new EffectPass(ctx.camera, new GrainEffect(p.amount as number)),
} satisfies PassEffectManifest
