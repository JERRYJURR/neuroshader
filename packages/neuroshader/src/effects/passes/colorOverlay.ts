import { BlendFunction, Effect } from 'postprocessing'
import { Color, Uniform } from 'three'
import type { ParamValues, PassEffectManifest } from '../../types'

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
  private readonly uColor: Uniform<Color>

  constructor(color: string, blend: string, opacity: number) {
    const uColor = new Uniform(new Color(color))
    super('ColorOverlayEffect', fragmentShader, {
      blendFunction: BLEND_MODES[blend] ?? BlendFunction.SCREEN,
      uniforms: new Map<string, Uniform>([['color', uColor]]),
    })
    this.uColor = uColor
    this.blendMode.opacity.value = opacity
  }

  applyParams(params: ParamValues): boolean {
    // Changing the blend function rebuilds the shader — let the runtime rebuild.
    if ('blend' in params) return false
    if (typeof params.color === 'string') this.uColor.value.set(params.color)
    if (typeof params.opacity === 'number') this.blendMode.opacity.value = params.opacity
    return true
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
  createEffect: (p) =>
    new ColorOverlayEffect(p.color as string, p.blend as string, p.opacity as number),
  updateEffect: (effect, p) => (effect as ColorOverlayEffect).applyParams(p),
} satisfies PassEffectManifest
