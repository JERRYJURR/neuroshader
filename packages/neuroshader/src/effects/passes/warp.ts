import { Effect } from 'postprocessing'
import { Uniform } from 'three'
import type { ParamValues, PassEffectManifest } from '../../types'

// Domain warp via layered sines — a flowing, organic turbulence.
const fragmentShader = /* glsl */ `
uniform float amount;
uniform float scale;
uniform float speed;
void mainUv(inout vec2 uv) {
  float t = time * speed;
  vec2 q = uv * scale;
  vec2 w = vec2(
    sin(q.y * 1.3 + t) + sin(q.x * 0.7 - t),
    cos(q.x * 1.1 - t) + sin(q.y * 0.9 + t)
  );
  uv += w * amount;
}
`

class WarpEffect extends Effect {
  private readonly uAmount: Uniform<number>
  private readonly uScale: Uniform<number>
  private readonly uSpeed: Uniform<number>

  constructor(amount: number, scale: number, speed: number) {
    const uAmount = new Uniform(amount)
    const uScale = new Uniform(scale)
    const uSpeed = new Uniform(speed)
    super('WarpEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['amount', uAmount],
        ['scale', uScale],
        ['speed', uSpeed],
      ]),
    })
    this.uAmount = uAmount
    this.uScale = uScale
    this.uSpeed = uSpeed
  }

  applyParams(p: ParamValues): void {
    if (typeof p.amount === 'number') this.uAmount.value = p.amount
    if (typeof p.scale === 'number') this.uScale.value = p.scale
    if (typeof p.speed === 'number') this.uSpeed.value = p.speed
  }
}

export const warp = {
  type: 'warp',
  layer: 'distortion',
  kind: 'pass',
  label: 'Warp',
  params: {
    amount: { type: 'number', label: 'Amount', min: 0, max: 0.1, step: 0.001, default: 0.02 },
    scale: { type: 'number', label: 'Scale', min: 0.5, max: 20, step: 0.1, default: 6 },
    speed: { type: 'number', label: 'Speed', min: 0, max: 5, step: 0.05, default: 1 },
  },
  createEffect: (p) =>
    new WarpEffect(p.amount as number, p.scale as number, p.speed as number),
  updateEffect: (effect, p) => {
    ;(effect as WarpEffect).applyParams(p)
  },
} satisfies PassEffectManifest
