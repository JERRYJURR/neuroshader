// Public API ----------------------------------------------------------------

export { NeuroShader, createNeuroShader } from './core/NeuroShader'
export type { NeuroShaderOptions } from './core/NeuroShader'

export { defineEffect, getEffect, hasEffect, listEffects } from './registry'
export { resolveParams } from './resolveParams'
export { builtinEffects, registerBuiltinEffects } from './effects'

export { LAYER_ORDER, layerKind } from './types'
export type {
  NeuroConfig,
  LayerConfig,
  LayerId,
  LayerKind,
  EffectInstanceConfig,
  ParamSpec,
  ParamSchema,
  ParamValues,
  FrameContext,
  SceneContext,
  PassContext,
  EffectHandle,
  EffectManifest,
  SceneEffectManifest,
  PassEffectManifest,
} from './types'

export { defaultPreset } from './presets/default'
