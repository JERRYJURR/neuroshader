import { Effect } from 'postprocessing'
import { Uniform } from 'three'
import type { ParamValues, PassEffectManifest } from '../../types'

// Concentric ripples radiating from the center, animated over time.
const fragmentShader = /* glsl */ `
uniform float amplitude;
uniform float frequency;
uniform float speed;
void mainUv(inout vec2 uv) {
  vec2 c = uv - 0.5;
  float r = length(c);
  float disp = sin(r * frequency - time * speed) * amplitude;
  uv += normalize(c + 1e-6) * disp;
}
`

class RippleEffect extends Effect {
  private readonly uAmplitude: Uniform<number>
  private readonly uFrequency: Uniform<number>
  private readonly uSpeed: Uniform<number>

  constructor(amplitude: number, frequency: number, speed: number) {
    const uAmplitude = new Uniform(amplitude)
    const uFrequency = new Uniform(frequency)
    const uSpeed = new Uniform(speed)
    super('RippleEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['amplitude', uAmplitude],
        ['frequency', uFrequency],
        ['speed', uSpeed],
      ]),
    })
    this.uAmplitude = uAmplitude
    this.uFrequency = uFrequency
    this.uSpeed = uSpeed
  }

  applyParams(p: ParamValues): void {
    if (typeof p.amplitude === 'number') this.uAmplitude.value = p.amplitude
    if (typeof p.frequency === 'number') this.uFrequency.value = p.frequency
    if (typeof p.speed === 'number') this.uSpeed.value = p.speed
  }
}

export const ripple = {
  type: 'ripple',
  layer: 'distortion',
  kind: 'pass',
  label: 'Ripple',
  params: {
    amplitude: { type: 'number', label: 'Amplitude', min: 0, max: 0.15, step: 0.001, default: 0.03 },
    frequency: { type: 'number', label: 'Frequency', min: 0, max: 100, step: 1, default: 40 },
    speed: { type: 'number', label: 'Speed', min: 0, max: 10, step: 0.1, default: 3 },
  },
  createEffect: (p) =>
    new RippleEffect(p.amplitude as number, p.frequency as number, p.speed as number),
  updateEffect: (effect, p) => {
    ;(effect as RippleEffect).applyParams(p)
  },
} satisfies PassEffectManifest
