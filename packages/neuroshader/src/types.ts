import type { Effect } from 'postprocessing'
import type * as THREE from 'three'

/**
 * The six fixed top-level layers, in render order.
 *
 * Layers 1–2 (`scene`, `object`) build a Three.js scene.
 * Layers 3–6 (`distortion`, `filter`, `blurGlow`, `post`) are screen-space
 * passes compiled into an ordered postprocessing chain.
 */
export type LayerId =
  | 'scene'
  | 'object'
  | 'distortion'
  | 'filter'
  | 'blurGlow'
  | 'post'

export const LAYER_ORDER: readonly LayerId[] = [
  'scene',
  'object',
  'distortion',
  'filter',
  'blurGlow',
  'post',
] as const

export type LayerKind = 'scene' | 'pass'

/** Whether a layer contributes to the 3D scene or to the screen-space pass chain. */
export function layerKind(layer: LayerId): LayerKind {
  return layer === 'scene' || layer === 'object' ? 'scene' : 'pass'
}

// ---------------------------------------------------------------------------
// Config (the serializable contract — this is what `export` produces and what
// the library consumes via `createNeuroShader`).
// ---------------------------------------------------------------------------

/** A single effect instance as stored in a config. */
export interface EffectInstanceConfig {
  /** Manifest type id, e.g. `"lensDistort"`. */
  type: string
  /** Stable instance id (used by the editor for selection / reordering). */
  id?: string
  /** Whether this effect contributes to the render. Defaults to `true`. */
  enabled?: boolean
  /** Param values keyed by name; omitted values fall back to schema defaults. */
  params?: Record<string, unknown>
}

export interface LayerConfig {
  enabled?: boolean
  effects: EffectInstanceConfig[]
}

export interface NeuroConfig {
  /** Schema version, for forward migrations. */
  version: number
  meta?: {
    name?: string
    /** neuroshader version that produced this config. */
    neuroshader?: string
  }
  camera?: {
    fov?: number
    position?: [number, number, number]
    target?: [number, number, number]
  }
  /** Background color as a hex string, e.g. `"#05070a"`. */
  background?: string
  layers: Partial<Record<LayerId, LayerConfig>>
}

// ---------------------------------------------------------------------------
// Param schema (drives the auto-generated inspector in the editor, and value
// resolution in the runtime).
// ---------------------------------------------------------------------------

interface ParamBase {
  label?: string
  hint?: string
}

export type ParamSpec =
  | (ParamBase & {
      type: 'number'
      min?: number
      max?: number
      step?: number
      default: number
    })
  | (ParamBase & { type: 'boolean'; default: boolean })
  | (ParamBase & { type: 'color'; default: string })
  | (ParamBase & {
      type: 'select'
      options: ReadonlyArray<{ label: string; value: string }>
      default: string
    })
  | (ParamBase & { type: 'vec2'; default: [number, number] })
  | (ParamBase & { type: 'vec3'; default: [number, number, number] })

export type ParamSchema = Record<string, ParamSpec>

/** Resolved param values handed to an effect factory. */
export type ParamValues = Record<string, unknown>

// ---------------------------------------------------------------------------
// Effect manifests (the registry pattern — one manifest per effect type).
// Scene effects mutate the Three scene; pass effects produce a composer pass.
// ---------------------------------------------------------------------------

/** Per-frame timing handed to update callbacks. */
export interface FrameContext {
  elapsed: number
  delta: number
}

/** Context handed to a scene effect when it is created. */
export interface SceneContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  /** Named host-supplied assets (textures, video, models). */
  assets: Record<string, unknown>
}

/** Context handed to a pass effect when it is created. */
export interface PassContext {
  camera: THREE.PerspectiveCamera
  assets: Record<string, unknown>
}

/** Returned by an effect's factory; lets the runtime drive and tear it down. */
export interface EffectHandle {
  /** Called once per frame. */
  update?: (frame: FrameContext) => void
  /**
   * Apply changed param values in place (no rebuild). Receives only the keys
   * that changed. Return `false` to signal the change needs a full rebuild
   * (e.g. geometry-altering params); anything else counts as handled live.
   */
  setParams?: (params: ParamValues) => boolean | void
  /** Release GPU/CPU resources. */
  dispose?: () => void
}

interface ManifestBase {
  type: string
  layer: LayerId
  label: string
  params?: ParamSchema
}

export interface SceneEffectManifest extends ManifestBase {
  kind: 'scene'
  create: (ctx: SceneContext, params: ParamValues) => EffectHandle | void
}

export interface PassEffectManifest extends ManifestBase {
  kind: 'pass'
  /** Build a postprocessing Effect; the runtime wraps it in an EffectPass. */
  createEffect: (params: ParamValues, ctx: PassContext) => Effect
  /**
   * Apply changed param values to a live Effect in place (no rebuild). Receives
   * only the changed keys. Return `false` to request a full rebuild instead.
   */
  updateEffect?: (effect: Effect, params: ParamValues) => boolean | void
}

export type EffectManifest = SceneEffectManifest | PassEffectManifest
