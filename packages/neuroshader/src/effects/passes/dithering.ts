import { Effect } from 'postprocessing'
import { Uniform } from 'three'
import type { ParamValues, PassEffectManifest } from '../../types'

// Ordered (4x4 Bayer) dithering, then quantize to N levels — a retro screentone.
const fragmentShader = /* glsl */ `
uniform float levels;
uniform float amount;
const float BAYER[16] = float[](
   0.0,  8.0,  2.0, 10.0,
  12.0,  4.0, 14.0,  6.0,
   3.0, 11.0,  1.0,  9.0,
  15.0,  7.0, 13.0,  5.0
);
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  int x = int(mod(gl_FragCoord.x, 4.0));
  int y = int(mod(gl_FragCoord.y, 4.0));
  float threshold = BAYER[y * 4 + x] / 16.0 - 0.5;
  vec3 c = inputColor.rgb + threshold * amount / levels;
  c = floor(c * levels + 0.5) / levels;
  outputColor = vec4(c, inputColor.a);
}
`

class DitheringEffect extends Effect {
  private readonly uLevels: Uniform<number>
  private readonly uAmount: Uniform<number>

  constructor(levels: number, amount: number) {
    const uLevels = new Uniform(levels)
    const uAmount = new Uniform(amount)
    super('DitheringEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['levels', uLevels],
        ['amount', uAmount],
      ]),
    })
    this.uLevels = uLevels
    this.uAmount = uAmount
  }

  applyParams(p: ParamValues): void {
    if (typeof p.levels === 'number') this.uLevels.value = p.levels
    if (typeof p.amount === 'number') this.uAmount.value = p.amount
  }
}

export const dithering = {
  type: 'dithering',
  layer: 'post',
  kind: 'pass',
  label: 'Dithering',
  params: {
    levels: { type: 'number', label: 'Levels', min: 2, max: 16, step: 1, default: 4 },
    amount: { type: 'number', label: 'Amount', min: 0, max: 2, step: 0.05, default: 1 },
  },
  createEffect: (p) => new DitheringEffect(p.levels as number, p.amount as number),
  updateEffect: (effect, p) => {
    ;(effect as DitheringEffect).applyParams(p)
  },
} satisfies PassEffectManifest
