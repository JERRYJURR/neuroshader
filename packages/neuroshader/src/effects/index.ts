import { defineEffect } from '../registry'
import type { EffectManifest } from '../types'

import { ambientLight } from './scene/ambientLight'
import { directionalLight } from './scene/directionalLight'
import { shadowGround } from './scene/shadowGround'
import { primitive } from './object/primitive'
import { lensDistort } from './passes/lensDistort'
import { posterize } from './passes/posterize'
import { findEdges } from './passes/findEdges'
import { bloom } from './passes/bloom'
import { noise } from './passes/noise'
import { colorOverlay } from './passes/colorOverlay'

/** Every effect that ships with neuroshader, in palette order. */
export const builtinEffects: EffectManifest[] = [
  ambientLight,
  directionalLight,
  shadowGround,
  primitive,
  lensDistort,
  posterize,
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
