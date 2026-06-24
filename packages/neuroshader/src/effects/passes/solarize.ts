import { Effect } from 'postprocessing'
import { Uniform } from 'three'
import type { ParamValues, PassEffectManifest } from '../../types'

// Per-channel tone reversal above a threshold (the classic solarization look).
const fragmentShader = /* glsl */ `
uniform float threshold;
uniform float amount;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = inputColor.rgb;
  vec3 solarized = mix(c, 1.0 - c, step(threshold, c));
  outputColor = vec4(mix(c, solarized, amount), inputColor.a);
}
`

class SolarizeEffect extends Effect {
  private readonly uThreshold: Uniform<number>
  private readonly uAmount: Uniform<number>

  constructor(threshold: number, amount: number) {
    const uThreshold = new Uniform(threshold)
    const uAmount = new Uniform(amount)
    super('SolarizeEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['threshold', uThreshold],
        ['amount', uAmount],
      ]),
    })
    this.uThreshold = uThreshold
    this.uAmount = uAmount
  }

  applyParams(p: ParamValues): void {
    if (typeof p.threshold === 'number') this.uThreshold.value = p.threshold
    if (typeof p.amount === 'number') this.uAmount.value = p.amount
  }
}

export const solarize = {
  type: 'solarize',
  layer: 'filter',
  kind: 'pass',
  label: 'Solarize',
  params: {
    threshold: { type: 'number', label: 'Threshold', min: 0, max: 1, step: 0.01, default: 0.5 },
    amount: { type: 'number', label: 'Amount', min: 0, max: 1, step: 0.01, default: 1 },
  },
  createEffect: (p) => new SolarizeEffect(p.threshold as number, p.amount as number),
  updateEffect: (effect, p) => {
    ;(effect as SolarizeEffect).applyParams(p)
  },
} satisfies PassEffectManifest
