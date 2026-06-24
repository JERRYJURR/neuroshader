import { Effect } from 'postprocessing'
import { Uniform } from 'three'
import type { ParamValues, PassEffectManifest } from '../../types'

// Quantize in gamma (perceptual) space so bands are spaced evenly across the
// visible range — matching the After Effects Posterize filter, and keeping
// detail in darker regions instead of crushing them.
const fragmentShader = /* glsl */ `
uniform float levels;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 perceptual = pow(max(inputColor.rgb, 0.0), vec3(1.0 / 2.2));
  vec3 quantized = floor(perceptual * levels + 0.5) / levels;
  vec3 linear = pow(quantized, vec3(2.2));
  outputColor = vec4(linear, inputColor.a);
}
`

class PosterizeEffect extends Effect {
  private readonly uLevels: Uniform<number>

  constructor(levels: number) {
    const uLevels = new Uniform(levels)
    super('PosterizeEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([['levels', uLevels]]),
    })
    this.uLevels = uLevels
  }

  applyParams(params: ParamValues): void {
    if (typeof params.levels === 'number') this.uLevels.value = params.levels
  }
}

export const posterize = {
  type: 'posterize',
  layer: 'filter',
  kind: 'pass',
  label: 'Posterize',
  params: {
    levels: { type: 'number', label: 'Levels', min: 2, max: 16, step: 1, default: 6 },
  },
  createEffect: (p) => new PosterizeEffect(p.levels as number),
  updateEffect: (effect, p) => {
    ;(effect as PosterizeEffect).applyParams(p)
  },
} satisfies PassEffectManifest
