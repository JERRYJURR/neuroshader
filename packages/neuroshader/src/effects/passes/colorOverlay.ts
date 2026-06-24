import { BlendFunction, Effect, EffectPass } from 'postprocessing'
import { Color, Uniform } from 'three'
import type { PassEffectManifest } from '../../types'

// Emit a solid color; the Effect's blend mode composites it over the input.
const fragmentShader = /* glsl */ `
uniform vec3 color;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  outputColor = vec4(color, 1.0);
}
`

const BLEND_MODES: Record<string, BlendFunction> = {
  normal: BlendFunction.NORMAL,
  screen: BlendFunction.SCREEN,
  multiply: BlendFunction.MULTIPLY,
  add: BlendFunction.ADD,
  overlay: BlendFunction.OVERLAY,
}

class ColorOverlayEffect extends Effect {
  constructor(color: string, blend: string, opacity: number) {
    super('ColorOverlayEffect', fragmentShader, {
      blendFunction: BLEND_MODES[blend] ?? BlendFunction.SCREEN,
      uniforms: new Map<string, Uniform>([['color', new Uniform(new Color(color))]]),
    })
    this.blendMode.opacity.value = opacity
  }
}

export const colorOverlay = {
  type: 'colorOverlay',
  layer: 'post',
  kind: 'pass',
  label: 'Color Overlay',
  params: {
    color: { type: 'color', label: 'Color', default: '#0bd1e6' },
    blend: {
      type: 'select',
      label: 'Blend',
      default: 'screen',
      options: [
        { label: 'Normal', value: 'normal' },
        { label: 'Screen', value: 'screen' },
        { label: 'Multiply', value: 'multiply' },
        { label: 'Add', value: 'add' },
        { label: 'Overlay', value: 'overlay' },
      ],
    },
    opacity: { type: 'number', label: 'Opacity', min: 0, max: 1, step: 0.01, default: 0.18 },
  },
  createPass: (p, ctx) =>
    new EffectPass(
      ctx.camera,
      new ColorOverlayEffect(p.color as string, p.blend as string, p.opacity as number),
    ),
} satisfies PassEffectManifest
