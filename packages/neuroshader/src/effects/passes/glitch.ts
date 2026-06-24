import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform } from 'three'
import type { ParamValues, PassEffectManifest } from '../../types'

// Time-stepped horizontal block displacement + RGB channel split.
const fragmentShader = /* glsl */ `
uniform float amount;
uniform float speed;
float hash(float n) { return fract(sin(n) * 43758.5453); }
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float t = floor(time * speed * 10.0);
  float row = floor(uv.y * 24.0);
  float band = step(0.7, hash(row + t)) * amount;
  float shift = (hash(row * 1.7 + t) - 0.5) * band;
  float ca = 0.006 * band;
  float r = texture(inputBuffer, uv + vec2(shift + ca, 0.0)).r;
  float g = texture(inputBuffer, uv + vec2(shift, 0.0)).g;
  float b = texture(inputBuffer, uv + vec2(shift - ca, 0.0)).b;
  outputColor = vec4(r, g, b, inputColor.a);
}
`

class GlitchEffect extends Effect {
  private readonly uAmount: Uniform<number>
  private readonly uSpeed: Uniform<number>

  constructor(amount: number, speed: number) {
    const uAmount = new Uniform(amount)
    const uSpeed = new Uniform(speed)
    super('NeuroGlitchEffect', fragmentShader, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ['amount', uAmount],
        ['speed', uSpeed],
      ]),
    })
    this.uAmount = uAmount
    this.uSpeed = uSpeed
  }

  applyParams(p: ParamValues): void {
    if (typeof p.amount === 'number') this.uAmount.value = p.amount
    if (typeof p.speed === 'number') this.uSpeed.value = p.speed
  }
}

export const glitch = {
  type: 'glitch',
  layer: 'post',
  kind: 'pass',
  label: 'Glitch',
  params: {
    amount: { type: 'number', label: 'Amount', min: 0, max: 0.2, step: 0.005, default: 0.04 },
    speed: { type: 'number', label: 'Speed', min: 0, max: 5, step: 0.05, default: 1 },
  },
  createEffect: (p) => new GlitchEffect(p.amount as number, p.speed as number),
  updateEffect: (effect, p) => {
    ;(effect as GlitchEffect).applyParams(p)
  },
} satisfies PassEffectManifest
