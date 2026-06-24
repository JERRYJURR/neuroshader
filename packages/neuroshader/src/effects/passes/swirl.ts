import { Effect } from 'postprocessing'
import { Uniform } from 'three'
import type { ParamValues, PassEffectManifest } from '../../types'

// Rotates UVs around the center, strongest at the center and easing to zero
// past `radius`.
const fragmentShader = /* glsl */ `
uniform float angle;
uniform float radius;
void mainUv(inout vec2 uv) {
  vec2 c = uv - 0.5;
  float d = length(c);
  float t = smoothstep(radius, 0.0, d);
  float a = angle * t;
  float s = sin(a);
  float co = cos(a);
  uv = 0.5 + mat2(co, -s, s, co) * c;
}
`

class SwirlEffect extends Effect {
  private readonly uAngle: Uniform<number>
  private readonly uRadius: Uniform<number>

  constructor(angle: number, radius: number) {
    const uAngle = new Uniform(angle)
    const uRadius = new Uniform(radius)
    super('SwirlEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['angle', uAngle],
        ['radius', uRadius],
      ]),
    })
    this.uAngle = uAngle
    this.uRadius = uRadius
  }

  applyParams(p: ParamValues): void {
    if (typeof p.angle === 'number') this.uAngle.value = p.angle
    if (typeof p.radius === 'number') this.uRadius.value = p.radius
  }
}

export const swirl = {
  type: 'swirl',
  layer: 'distortion',
  kind: 'pass',
  label: 'Swirl',
  params: {
    angle: { type: 'number', label: 'Angle', min: -6.28, max: 6.28, step: 0.01, default: 2 },
    radius: { type: 'number', label: 'Radius', min: 0.05, max: 1, step: 0.01, default: 0.5 },
  },
  createEffect: (p) => new SwirlEffect(p.angle as number, p.radius as number),
  updateEffect: (effect, p) => {
    ;(effect as SwirlEffect).applyParams(p)
  },
} satisfies PassEffectManifest
