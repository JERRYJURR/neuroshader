import { Effect, EffectPass } from 'postprocessing'
import { Uniform } from 'three'
import type { PassEffectManifest } from '../../types'

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
  constructor(levels: number) {
    super('PosterizeEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([['levels', new Uniform(levels)]]),
    })
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
  createPass: (p, ctx) =>
    new EffectPass(ctx.camera, new PosterizeEffect(p.levels as number)),
} satisfies PassEffectManifest
