import { defineEffect } from '../registry'
import type { EffectManifest } from '../types'

import { background } from './scene/background'
import { ambientLight } from './scene/ambientLight'
import { directionalLight } from './scene/directionalLight'
import { shadowGround } from './scene/shadowGround'
import { backdrop } from './scene/backdrop'
import { primitive } from './object/primitive'
import { lensDistort } from './passes/lensDistort'
import { solarize } from './passes/solarize'
import { posterize } from './passes/posterize'
import { threshold } from './passes/threshold'
import { findEdges } from './passes/findEdges'
import { bloom } from './passes/bloom'
import { noise } from './passes/noise'
import { colorOverlay } from './passes/colorOverlay'

/** Every effect that ships with neuroshader, in palette order. */
export const builtinEffects: EffectManifest[] = [
  background,
  ambientLight,
  directionalLight,
  shadowGround,
  backdrop,
  primitive,
  lensDistort,
  solarize,
  posterize,
  threshold,
  findEdges,
  bloom,
  noise,
  colorOverlay,
]

let registered = false

/** Register all built-in effects into the global registry (idempotent). */
export function registerBuiltinEffects(): void {
  if (registered) return
  registered = true
  for (const manifest of builtinEffects) defineEffect(manifest)
}
