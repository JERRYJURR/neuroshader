import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform } from 'three'
import type { ParamValues, PassEffectManifest } from '../../types'

// Sobel edge detection. Declared CONVOLUTION so it runs as its own pass and
// reads the full output of the previous pass via `inputBuffer`.
const fragmentShader = /* glsl */ `
uniform float intensity;

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 t = texelSize;
  float tl = luma(texture(inputBuffer, uv + vec2(-t.x,  t.y)).rgb);
  float ml = luma(texture(inputBuffer, uv + vec2(-t.x,  0.0)).rgb);
  float bl = luma(texture(inputBuffer, uv + vec2(-t.x, -t.y)).rgb);
  float tc = luma(texture(inputBuffer, uv + vec2( 0.0,  t.y)).rgb);
  float bc = luma(texture(inputBuffer, uv + vec2( 0.0, -t.y)).rgb);
  float tr = luma(texture(inputBuffer, uv + vec2( t.x,  t.y)).rgb);
  float mr = luma(texture(inputBuffer, uv + vec2( t.x,  0.0)).rgb);
  float br = luma(texture(inputBuffer, uv + vec2( t.x, -t.y)).rgb);

  float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
  float gy =  tl + 2.0 * tc + tr - bl - 2.0 * bc - br;
  float g = length(vec2(gx, gy)) * intensity;

  outputColor = vec4(vec3(g), inputColor.a);
}
`

class FindEdgesEffect extends Effect {
  private readonly uIntensity: Uniform<number>

  constructor(intensity: number) {
    const uIntensity = new Uniform(intensity)
    super('FindEdgesEffect', fragmentShader, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([['intensity', uIntensity]]),
    })
    this.uIntensity = uIntensity
  }

  applyParams(params: ParamValues): void {
    if (typeof params.intensity === 'number') this.uIntensity.value = params.intensity
  }
}

export const findEdges = {
  type: 'findEdges',
  layer: 'filter',
  kind: 'pass',
  label: 'Find Edges',
  params: {
    intensity: { type: 'number', label: 'Intensity', min: 0, max: 3, step: 0.05, default: 0.8 },
  },
  createEffect: (p) => new FindEdgesEffect(p.intensity as number),
  updateEffect: (effect, p) => {
    ;(effect as FindEdgesEffect).applyParams(p)
  },
} satisfies PassEffectManifest
