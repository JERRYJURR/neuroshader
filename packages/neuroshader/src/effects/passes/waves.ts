import { Effect } from 'postprocessing'
import { Uniform } from 'three'
import type { ParamValues, PassEffectManifest } from '../../types'

// Sinusoidal UV displacement on both axes — a wavy, watery warp.
const fragmentShader = /* glsl */ `
uniform float amplitude;
uniform float frequency;
uniform float speed;
void mainUv(inout vec2 uv) {
  uv.x += sin(uv.y * frequency + time * speed) * amplitude;
  uv.y += sin(uv.x * frequency + time * speed) * amplitude;
}
`

class WavesEffect extends Effect {
  private readonly uAmplitude: Uniform<number>
  private readonly uFrequency: Uniform<number>
  private readonly uSpeed: Uniform<number>

  constructor(amplitude: number, frequency: number, speed: number) {
    const uAmplitude = new Uniform(amplitude)
    const uFrequency = new Uniform(frequency)
    const uSpeed = new Uniform(speed)
    super('WavesEffect', fragmentShader, {
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

export const waves = {
  type: 'waves',
  layer: 'distortion',
  kind: 'pass',
  label: 'Waves',
  params: {
    amplitude: { type: 'number', label: 'Amplitude', min: 0, max: 0.1, step: 0.001, default: 0.02 },
    frequency: { type: 'number', label: 'Frequency', min: 0, max: 60, step: 1, default: 18 },
    speed: { type: 'number', label: 'Speed', min: 0, max: 10, step: 0.1, default: 2 },
  },
  createEffect: (p) =>
    new WavesEffect(p.amplitude as number, p.frequency as number, p.speed as number),
  updateEffect: (effect, p) => {
    ;(effect as WavesEffect).applyParams(p)
  },
} satisfies PassEffectManifest
