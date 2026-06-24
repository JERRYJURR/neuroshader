import { Effect, EffectAttribute } from 'postprocessing'
import { Uniform } from 'three'
import type { ParamValues, PassEffectManifest } from '../../types'

// Directional (linear) blur — a cheap motion-blur streak along an angle.
const fragmentShader = /* glsl */ `
uniform float strength;
uniform float angle;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 dir = vec2(cos(angle), sin(angle)) * texelSize * strength;
  vec3 sum = vec3(0.0);
  const int N = 9;
  for (int i = 0; i < N; i++) {
    float t = float(i) / float(N - 1) - 0.5;
    sum += texture(inputBuffer, uv + dir * t).rgb;
  }
  outputColor = vec4(sum / float(N), inputColor.a);
}
`

class MotionBlurEffect extends Effect {
  private readonly uStrength: Uniform<number>
  private readonly uAngle: Uniform<number>

  constructor(strength: number, angle: number) {
    const uStrength = new Uniform(strength)
    const uAngle = new Uniform(angle)
    super('MotionBlurEffect', fragmentShader, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ['strength', uStrength],
        ['angle', uAngle],
      ]),
    })
    this.uStrength = uStrength
    this.uAngle = uAngle
  }

  applyParams(p: ParamValues): void {
    if (typeof p.strength === 'number') this.uStrength.value = p.strength
    if (typeof p.angle === 'number') this.uAngle.value = p.angle
  }
}

export const motionBlur = {
  type: 'motionBlur',
  layer: 'blurGlow',
  kind: 'pass',
  label: 'Motion Blur',
  params: {
    strength: { type: 'number', label: 'Strength', min: 0, max: 60, step: 0.5, default: 16 },
    angle: { type: 'number', label: 'Angle', min: -3.14, max: 3.14, step: 0.01, default: 0 },
  },
  createEffect: (p) => new MotionBlurEffect(p.strength as number, p.angle as number),
  updateEffect: (effect, p) => {
    ;(effect as MotionBlurEffect).applyParams(p)
  },
} satisfies PassEffectManifest
