import { Effect } from 'postprocessing'
import { Color, Uniform } from 'three'
import type { ParamValues, PassEffectManifest } from '../../types'

// Remap luminance onto a two-stop gradient (low -> high).
const fragmentShader = /* glsl */ `
uniform vec3 lowColor;
uniform vec3 highColor;
uniform float amount;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float l = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));
  vec3 mapped = mix(lowColor, highColor, l);
  outputColor = vec4(mix(inputColor.rgb, mapped, amount), inputColor.a);
}
`

class GradientMapEffect extends Effect {
  private readonly uLow: Uniform<Color>
  private readonly uHigh: Uniform<Color>
  private readonly uAmount: Uniform<number>

  constructor(low: string, high: string, amount: number) {
    const uLow = new Uniform(new Color(low))
    const uHigh = new Uniform(new Color(high))
    const uAmount = new Uniform(amount)
    super('GradientMapEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['lowColor', uLow],
        ['highColor', uHigh],
        ['amount', uAmount],
      ]),
    })
    this.uLow = uLow
    this.uHigh = uHigh
    this.uAmount = uAmount
  }

  applyParams(p: ParamValues): void {
    if (typeof p.lowColor === 'string') this.uLow.value.set(p.lowColor)
    if (typeof p.highColor === 'string') this.uHigh.value.set(p.highColor)
    if (typeof p.amount === 'number') this.uAmount.value = p.amount
  }
}

export const gradientMap = {
  type: 'gradientMap',
  layer: 'post',
  kind: 'pass',
  label: 'Gradient Map',
  params: {
    lowColor: { type: 'color', label: 'Shadows', default: '#06121a' },
    highColor: { type: 'color', label: 'Highlights', default: '#7df9ff' },
    amount: { type: 'number', label: 'Amount', min: 0, max: 1, step: 0.01, default: 1 },
  },
  createEffect: (p) =>
    new GradientMapEffect(p.lowColor as string, p.highColor as string, p.amount as number),
  updateEffect: (effect, p) => {
    ;(effect as GradientMapEffect).applyParams(p)
  },
} satisfies PassEffectManifest
