import { Effect } from 'postprocessing'
import { Uniform } from 'three'
import type { ParamValues, PassEffectManifest } from '../../types'

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
  private readonly uAmount: Uniform<number>

  constructor(amount: number) {
    const uAmount = new Uniform(amount)
    super('GrainEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([['amount', uAmount]]),
    })
    this.uAmount = uAmount
  }

  applyParams(params: ParamValues): void {
    if (typeof params.amount === 'number') this.uAmount.value = params.amount
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
  createEffect: (p) => new GrainEffect(p.amount as number),
  updateEffect: (effect, p) => {
    ;(effect as GrainEffect).applyParams(p)
  },
} satisfies PassEffectManifest
