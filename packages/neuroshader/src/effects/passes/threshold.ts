import { Effect } from 'postprocessing'
import { Uniform } from 'three'
import type { ParamValues, PassEffectManifest } from '../../types'

// Luminance threshold to high-contrast black & white (After Effects Threshold).
const fragmentShader = /* glsl */ `
uniform float threshold;
uniform float smoothness;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float l = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));
  float v = smoothstep(threshold - smoothness, threshold + smoothness, l);
  outputColor = vec4(vec3(v), inputColor.a);
}
`

class ThresholdEffect extends Effect {
  private readonly uThreshold: Uniform<number>
  private readonly uSmoothness: Uniform<number>

  constructor(threshold: number, smoothness: number) {
    const uThreshold = new Uniform(threshold)
    const uSmoothness = new Uniform(smoothness)
    super('ThresholdEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['threshold', uThreshold],
        ['smoothness', uSmoothness],
      ]),
    })
    this.uThreshold = uThreshold
    this.uSmoothness = uSmoothness
  }

  applyParams(p: ParamValues): void {
    if (typeof p.threshold === 'number') this.uThreshold.value = p.threshold
    if (typeof p.smoothness === 'number') this.uSmoothness.value = p.smoothness
  }
}

export const threshold = {
  type: 'threshold',
  layer: 'filter',
  kind: 'pass',
  label: 'Threshold',
  params: {
    threshold: { type: 'number', label: 'Threshold', min: 0, max: 1, step: 0.01, default: 0.5 },
    smoothness: { type: 'number', label: 'Smoothness', min: 0, max: 0.5, step: 0.005, default: 0.02 },
  },
  createEffect: (p) => new ThresholdEffect(p.threshold as number, p.smoothness as number),
  updateEffect: (effect, p) => {
    ;(effect as ThresholdEffect).applyParams(p)
  },
} satisfies PassEffectManifest
