import type { EffectManifest, LayerId } from './types'

/**
 * The global effect registry. Adding a new effect to neuroshader is exactly
 * one `defineEffect(...)` call — the editor's palette, the inspector, and the
 * runtime instantiation all read from here.
 *
 * (No effects are registered yet — they arrive in M2.)
 */
const registry = new Map<string, EffectManifest>()

export function defineEffect<T extends EffectManifest>(manifest: T): T {
  if (registry.has(manifest.type)) {
    console.warn(
      `[neuroshader] effect "${manifest.type}" is already registered; overwriting.`,
    )
  }
  registry.set(manifest.type, manifest)
  return manifest
}

export function getEffect(type: string): EffectManifest | undefined {
  return registry.get(type)
}

export function hasEffect(type: string): boolean {
  return registry.has(type)
}

/** All registered manifests, optionally filtered to a single layer. */
export function listEffects(layer?: LayerId): EffectManifest[] {
  const all = [...registry.values()]
  return layer ? all.filter((m) => m.layer === layer) : all
}
