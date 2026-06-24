import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform } from 'three'
import type { ParamValues, PassEffectManifest } from '../../types'

// Blur whose radius ramps along a direction across the frame (gradient blur).
const fragmentShader = /* glsl */ `
uniform float radius;
uniform float angle;
const vec2 POISSON[12] = vec2[](
  vec2(-0.326, -0.406), vec2(-0.840, -0.074), vec2(-0.696,  0.457),
  vec2(-0.203,  0.621), vec2( 0.962, -0.195), vec2( 0.473, -0.480),
  vec2( 0.519,  0.767), vec2( 0.185, -0.893), vec2( 0.507,  0.064),
  vec2( 0.896,  0.412), vec2(-0.322, -0.933), vec2(-0.792, -0.598)
);
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 dir = vec2(cos(angle), sin(angle));
  float g = clamp(dot(uv - 0.5, dir) + 0.5, 0.0, 1.0);
  vec2 r = texelSize * radius * g;
  vec3 sum = inputColor.rgb;
  for (int i = 0; i < 12; i++) sum += texture(inputBuffer, uv + POISSON[i] * r).rgb;
  outputColor = vec4(sum / 13.0, inputColor.a);
}
`

class ProgressiveBlurEffect extends Effect {
  private readonly uRadius: Uniform<number>
  private readonly uAngle: Uniform<number>

  constructor(radius: number, angle: number) {
    const uRadius = new Uniform(radius)
    const uAngle = new Uniform(angle)
    super('ProgressiveBlurEffect', fragmentShader, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ['radius', uRadius],
        ['angle', uAngle],
      ]),
    })
    this.uRadius = uRadius
    this.uAngle = uAngle
  }

  applyParams(p: ParamValues): void {
    if (typeof p.radius === 'number') this.uRadius.value = p.radius
    if (typeof p.angle === 'number') this.uAngle.value = p.angle
  }
}

export const progressiveBlur = {
  type: 'progressiveBlur',
  layer: 'blurGlow',
  kind: 'pass',
  label: 'Progressive Blur',
  params: {
    radius: { type: 'number', label: 'Radius', min: 0, max: 80, step: 0.5, default: 28 },
    angle: { type: 'number', label: 'Direction', min: -3.14, max: 3.14, step: 0.01, default: -1.5708 },
  },
  createEffect: (p) => new ProgressiveBlurEffect(p.radius as number, p.angle as number),
  updateEffect: (effect, p) => {
    ;(effect as ProgressiveBlurEffect).applyParams(p)
  },
} satisfies PassEffectManifest
