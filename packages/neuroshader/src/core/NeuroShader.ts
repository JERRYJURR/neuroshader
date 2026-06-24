import { EffectComposer, EffectPass, RenderPass } from 'postprocessing'
import type { Effect, Pass } from 'postprocessing'
import * as THREE from 'three'
import { registerBuiltinEffects } from '../effects'
import { getEffect } from '../registry'
import { resolveParams } from '../resolveParams'
import { LAYER_ORDER } from '../types'
import type {
  EffectHandle,
  EffectManifest,
  NeuroConfig,
  ParamValues,
  PassContext,
  SceneContext,
} from '../types'

export interface NeuroShaderOptions {
  /** Named assets (textures, video, models) supplied by the host at runtime. */
  assets?: Record<string, unknown>
  /** Upper bound on devicePixelRatio. Default `2`. */
  maxPixelRatio?: number
  /** Start the render loop immediately on construction. Default `false`. */
  autoStart?: boolean
}

const DEFAULT_BACKGROUND = '#05070a'

/** A built effect, tracked by its instance id for live param updates. */
interface BuiltEffect {
  manifest: EffectManifest
  handle?: EffectHandle
  effect?: Effect
}

/**
 * The neuroshader runtime. Mounts a WebGL canvas, builds a Three.js scene plus
 * a postprocessing composer from a {@link NeuroConfig}, and renders it on a
 * continuous loop.
 *
 * Scene/object-layer effects mutate the scene; the four screen-space layers
 * compile, in fixed layer order, into the composer's pass chain (one
 * `EffectPass` per effect).
 */
export class NeuroShader {
  readonly canvas: HTMLCanvasElement
  readonly renderer: THREE.WebGLRenderer
  readonly scene: THREE.Scene
  readonly camera: THREE.PerspectiveCamera
  readonly composer: EffectComposer

  private _config: NeuroConfig
  private readonly _assets: Record<string, unknown>
  private readonly _ownsCanvas: boolean
  private readonly _sizeEl: HTMLElement
  private readonly _resizeObserver: ResizeObserver
  private readonly _handles: EffectHandle[] = []
  private readonly _passes: Pass[] = []
  private readonly _byId = new Map<string, BuiltEffect>()
  private _raf = 0
  private _running = false
  private _lastTime = 0
  private _elapsed = 0

  constructor(
    target: HTMLElement | HTMLCanvasElement,
    config: NeuroConfig,
    options: NeuroShaderOptions = {},
  ) {
    registerBuiltinEffects()
    this._config = config
    this._assets = options.assets ?? {}

    if (target instanceof HTMLCanvasElement) {
      this.canvas = target
      this._sizeEl = target.parentElement ?? target
      this._ownsCanvas = false
    } else {
      this.canvas = document.createElement('canvas')
      this.canvas.style.display = 'block'
      this.canvas.style.width = '100%'
      this.canvas.style.height = '100%'
      target.appendChild(this.canvas)
      this._sizeEl = target
      this._ownsCanvas = true
    }

    const { width, height } = this._measure()

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    })
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, options.maxPixelRatio ?? 2),
    )
    this.renderer.shadowMap.enabled = true

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(config.background ?? DEFAULT_BACKGROUND)

    this.camera = new THREE.PerspectiveCamera(
      config.camera?.fov ?? 45,
      width / height,
      0.1,
      100,
    )
    const [px, py, pz] = config.camera?.position ?? [0, 0, 5]
    this.camera.position.set(px, py, pz)
    const [tx, ty, tz] = config.camera?.target ?? [0, 0, 0]
    this.camera.lookAt(tx, ty, tz)

    // HalfFloat frame buffer keeps headroom for HDR effects (e.g. bloom).
    this.composer = new EffectComposer(this.renderer, {
      frameBufferType: THREE.HalfFloatType,
    })
    this.composer.setSize(width, height, false)

    this._build()

    this._resizeObserver = new ResizeObserver(() => this._resize())
    this._resizeObserver.observe(this._sizeEl)

    if (options.autoStart) this.start()
  }

  /** The config this instance was created with. */
  get config(): NeuroConfig {
    return this._config
  }

  /** Seconds elapsed across the running render loop. */
  get elapsed(): number {
    return this._elapsed
  }

  start(): void {
    if (this._running) return
    this._running = true
    this._lastTime = performance.now()
    this._tick()
  }

  stop(): void {
    if (!this._running) return
    this._running = false
    cancelAnimationFrame(this._raf)
  }

  /**
   * Swap in a new config. Tears down the current scene effects + pass chain and
   * rebuilds, reusing the renderer, canvas, scene, and composer. Used for
   * structural edits (add/remove/reorder/enable).
   */
  setConfig(config: NeuroConfig): void {
    this._config = config
    this._teardown()

    this.scene.background = new THREE.Color(config.background ?? DEFAULT_BACKGROUND)
    this.camera.fov = config.camera?.fov ?? 45
    const [px, py, pz] = config.camera?.position ?? [0, 0, 5]
    this.camera.position.set(px, py, pz)
    const [tx, ty, tz] = config.camera?.target ?? [0, 0, 0]
    this.camera.lookAt(tx, ty, tz)
    this.camera.updateProjectionMatrix()

    this._build()
  }

  /**
   * Apply changed params to one effect *in place* (no rebuild) — used for live
   * slider/color edits. `params` holds only the changed keys. Returns `false`
   * if the effect can't apply the change live and a {@link setConfig} rebuild is
   * needed (e.g. geometry- or shader-altering params).
   */
  updateParams(id: string, params: ParamValues): boolean {
    const built = this._byId.get(id)
    if (!built) return false
    const { manifest } = built

    if (manifest.kind === 'scene') {
      const setParams = built.handle?.setParams
      if (!setParams) return false
      return setParams(params) !== false
    }

    if (!built.effect || !manifest.updateEffect) return false
    return manifest.updateEffect(built.effect, params) !== false
  }

  dispose(): void {
    this.stop()
    this._resizeObserver.disconnect()
    this._teardown()
    this.composer.dispose()
    this.renderer.dispose()
    if (this._ownsCanvas) this.canvas.remove()
  }

  // -------------------------------------------------------------------------

  /** Assemble the scene and composer chain from the config. */
  private _build(): void {
    const sceneCtx: SceneContext = {
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      assets: this._assets,
    }
    const passCtx: PassContext = { camera: this.camera, assets: this._assets }

    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)
    this._passes.push(renderPass)

    for (const layer of LAYER_ORDER) {
      const layerConfig = this._config.layers[layer]
      if (!layerConfig || layerConfig.enabled === false) continue

      layerConfig.effects.forEach((instance, index) => {
        if (instance.enabled === false) return

        const manifest = getEffect(instance.type)
        if (!manifest) {
          console.warn(`[neuroshader] unknown effect "${instance.type}" (skipped)`)
          return
        }

        const id = instance.id ?? `${layer}:${instance.type}:${index}`
        const params = resolveParams(manifest.params, instance.params)

        if (manifest.kind === 'scene') {
          const handle = manifest.create(sceneCtx, params) ?? undefined
          if (handle) this._handles.push(handle)
          this._byId.set(id, { manifest, handle })
        } else {
          const effect = manifest.createEffect(params, passCtx)
          const pass = new EffectPass(this.camera, effect)
          this.composer.addPass(pass)
          this._passes.push(pass)
          this._byId.set(id, { manifest, effect })
        }
      })
    }
  }

  /** Dispose all scene-effect handles and composer passes. */
  private _teardown(): void {
    for (const handle of this._handles) handle.dispose?.()
    this._handles.length = 0
    this.composer.removeAllPasses()
    for (const pass of this._passes) pass.dispose()
    this._passes.length = 0
    this._byId.clear()
  }

  private _tick = (): void => {
    this._raf = requestAnimationFrame(this._tick)
    const now = performance.now()
    // Clamp so a backgrounded tab / pause doesn't produce a huge jump.
    const delta = Math.min((now - this._lastTime) / 1000, 0.1)
    this._lastTime = now
    this._elapsed += delta

    const frame = { elapsed: this._elapsed, delta }
    for (const handle of this._handles) handle.update?.(frame)

    this.composer.render(delta)
  }

  private _measure(): { width: number; height: number } {
    return {
      width: this._sizeEl.clientWidth || window.innerWidth,
      height: this._sizeEl.clientHeight || window.innerHeight,
    }
  }

  private _resize = (): void => {
    const { width, height } = this._measure()
    if (width === 0 || height === 0) return
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.composer.setSize(width, height, false)
  }
}

/** Factory mirror of `new NeuroShader(...)` — the primary public entry point. */
export function createNeuroShader(
  target: HTMLElement | HTMLCanvasElement,
  config: NeuroConfig,
  options?: NeuroShaderOptions,
): NeuroShader {
  return new NeuroShader(target, config, options)
}
