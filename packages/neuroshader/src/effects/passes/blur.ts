import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform } from 'three'
import type { ParamValues, PassEffectManifest } from '../../types'

// Single-pass Poisson-disk blur (cheap, soft).
const fragmentShader = /* glsl */ `
uniform float radius;
const vec2 POISSON[12] = vec2[](
  vec2(-0.326, -0.406), vec2(-0.840, -0.074), vec2(-0.696,  0.457),
  vec2(-0.203,  0.621), vec2( 0.962, -0.195), vec2( 0.473, -0.480),
  vec2( 0.519,  0.767), vec2( 0.185, -0.893), vec2( 0.507,  0.064),
  vec2( 0.896,  0.412), vec2(-0.322, -0.933), vec2(-0.792, -0.598)
);
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 r = texelSize * radius;
  vec3 sum = inputColor.rgb;
  for (int i = 0; i < 12; i++) sum += texture(inputBuffer, uv + POISSON[i] * r).rgb;
  outputColor = vec4(sum / 13.0, inputColor.a);
}
`

class BlurEffect extends Effect {
  private readonly uRadius: Uniform<number>

  constructor(radius: number) {
    const uRadius = new Uniform(radius)
    super('BlurEffect', fragmentShader, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([['radius', uRadius]]),
    })
    this.uRadius = uRadius
  }

  applyParams(p: ParamValues): void {
    if (typeof p.radius === 'number') this.uRadius.value = p.radius
  }
}

export const blur = {
  type: 'blur',
  layer: 'blurGlow',
  kind: 'pass',
  label: 'Blur',
  params: {
    radius: { type: 'number', label: 'Radius', min: 0, max: 50, step: 0.5, default: 8 },
  },
  createEffect: (p) => new BlurEffect(p.radius as number),
  updateEffect: (effect, p) => {
    ;(effect as BlurEffect).applyParams(p)
  },
} satisfies PassEffectManifest
