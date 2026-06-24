import { defineEffect } from '../registry'
import type { EffectManifest } from '../types'

// Scene
import { background } from './scene/background'
import { fog } from './scene/fog'
import { ambientLight } from './scene/ambientLight'
import { directionalLight } from './scene/directionalLight'
import { shadowGround } from './scene/shadowGround'
import { backdrop } from './scene/backdrop'
// Object
import { primitive } from './object/primitive'
// Distortion
import { lensDistort } from './passes/lensDistort'
import { ripple } from './passes/ripple'
import { swirl } from './passes/swirl'
import { waves } from './passes/waves'
import { warp } from './passes/warp'
import { mouseTrail } from './passes/mouseTrail'
// Filter
import { solarize } from './passes/solarize'
import { posterize } from './passes/posterize'
import { threshold } from './passes/threshold'
import { findEdges } from './passes/findEdges'
// Blur / Glow
import { blur } from './passes/blur'
import { progressiveBlur } from './passes/progressiveBlur'
import { motionBlur } from './passes/motionBlur'
import { depthOfField } from './passes/depthOfField'
import { bloom } from './passes/bloom'
import { fastBloom } from './passes/fastBloom'
// Post
import { noise } from './passes/noise'
import { dithering } from './passes/dithering'
import { gradientMap } from './passes/gradientMap'
import { colorOverlay } from './passes/colorOverlay'
import { glitch } from './passes/glitch'

/** Every effect that ships with neuroshader, in palette order. */
export const builtinEffects: EffectManifest[] = [
  // Scene
  background,
  fog,
  ambientLight,
  directionalLight,
  shadowGround,
  backdrop,
  // Object
  primitive,
  // Distortion
  lensDistort,
  ripple,
  swirl,
  waves,
  warp,
  mouseTrail,
  // Filter
  solarize,
  posterize,
  threshold,
  findEdges,
  // Blur / Glow
  blur,
  progressiveBlur,
  motionBlur,
  depthOfField,
  bloom,
  fastBloom,
  // Post
  noise,
  dithering,
  gradientMap,
  colorOverlay,
  glitch,
]

let registered = false

/** Register all built-in effects into the global registry (idempotent). */
export function registerBuiltinEffects(): void {
  if (registered) return
  registered = true
  for (const manifest of builtinEffects) defineEffect(manifest)
}
