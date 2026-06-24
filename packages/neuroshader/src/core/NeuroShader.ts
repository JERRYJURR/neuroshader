import { EffectComposer, RenderPass } from 'postprocessing'
import * as THREE from 'three'
import type { NeuroConfig } from '../types'

export interface NeuroShaderOptions {
  /** Named assets (textures, video, models) supplied by the host at runtime. */
  assets?: Record<string, unknown>
  /** Upper bound on devicePixelRatio. Default `2`. */
  maxPixelRatio?: number
  /** Start the render loop immediately on construction. Default `false`. */
  autoStart?: boolean
}

const DEFAULT_BACKGROUND = '#05070a'

/**
 * The neuroshader runtime. Mounts a WebGL canvas, builds a Three.js scene and
 * a postprocessing composer, and renders a config on a continuous loop.
 *
 * M1: renders a fixed "bootstrap" scene (a rotating, lit, shadow-casting cube)
 * to prove the pipeline end to end. M2 replaces this with config-driven scene
 * + pass effects sourced from the registry.
 */
export class NeuroShader {
  readonly canvas: HTMLCanvasElement
  readonly renderer: THREE.WebGLRenderer
  readonly scene: THREE.Scene
  readonly camera: THREE.PerspectiveCamera
  readonly composer: EffectComposer

  private readonly _config: NeuroConfig
  private readonly _sizeEl: HTMLElement
  private readonly _resizeObserver: ResizeObserver
  private _raf = 0
  private _running = false
  private _lastTime = 0
  private _elapsed = 0

  /** M1-only bootstrap scene; removed once the scene is config-driven (M2). */
  private _bootstrap?: { mesh: THREE.Mesh; dispose: () => void }

  constructor(
    target: HTMLElement | HTMLCanvasElement,
    config: NeuroConfig,
    options: NeuroShaderOptions = {},
  ) {
    this._config = config

    // Resolve the canvas and the element we measure for sizing.
    if (target instanceof HTMLCanvasElement) {
      this.canvas = target
      this._sizeEl = target.parentElement ?? target
    } else {
      this.canvas = document.createElement('canvas')
      this.canvas.style.display = 'block'
      this.canvas.style.width = '100%'
      this.canvas.style.height = '100%'
      target.appendChild(this.canvas)
      this._sizeEl = target
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

    // HalfFloat frame buffer keeps headroom for HDR effects (bloom, M2).
    this.composer = new EffectComposer(this.renderer, {
      frameBufferType: THREE.HalfFloatType,
    })
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.composer.setSize(width, height, false)

    this._buildBootstrapScene()

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

  dispose(): void {
    this.stop()
    this._resizeObserver.disconnect()
    this._bootstrap?.dispose()
    this.composer.dispose()
    this.renderer.dispose()
  }

  // -------------------------------------------------------------------------

  private _tick = (): void => {
    this._raf = requestAnimationFrame(this._tick)
    const now = performance.now()
    // Clamp so a backgrounded tab / pause doesn't produce a huge jump.
    const delta = Math.min((now - this._lastTime) / 1000, 0.1)
    this._lastTime = now
    this._elapsed += delta

    // M1: spin the bootstrap cube.
    if (this._bootstrap) {
      this._bootstrap.mesh.rotation.x += delta * 0.35
      this._bootstrap.mesh.rotation.y += delta * 0.55
    }

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

  /** Temporary M1 hero scene: a rotating, lit, shadow-casting cube. */
  private _buildBootstrapScene(): void {
    const group = new THREE.Group()

    // Cyan key light with soft shadows.
    const key = new THREE.DirectionalLight(0x8fdfff, 3)
    key.position.set(4, 6, 5)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.near = 1
    key.shadow.camera.far = 30
    const shadowCam = key.shadow.camera
    shadowCam.left = -8
    shadowCam.right = 8
    shadowCam.top = 8
    shadowCam.bottom = -8
    shadowCam.updateProjectionMatrix()
    group.add(key)

    // Ambient fill + cool rim for a sci-fi edge.
    group.add(new THREE.AmbientLight(0x152a33, 1.2))
    const rim = new THREE.DirectionalLight(0x2bd1e6, 2)
    rim.position.set(-5, 2, -4)
    group.add(rim)

    // The hero cube.
    const geometry = new THREE.BoxGeometry(1.6, 1.6, 1.6)
    const material = new THREE.MeshStandardMaterial({
      color: 0x0e2a33,
      metalness: 0.6,
      roughness: 0.25,
      emissive: 0x07171c,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)

    // Ground plane that only shows the shadow over the background.
    const groundGeo = new THREE.PlaneGeometry(40, 40)
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.55 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -1.4
    ground.receiveShadow = true
    group.add(ground)

    this.scene.add(group)

    this._bootstrap = {
      mesh,
      dispose: () => {
        geometry.dispose()
        material.dispose()
        groundGeo.dispose()
        groundMat.dispose()
        this.scene.remove(group)
      },
    }
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
