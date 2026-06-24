import { create } from 'zustand'
import { defaultPreset, LAYER_ORDER } from 'neuroshader'
import type { EffectInstanceConfig, LayerConfig, LayerId, NeuroConfig } from 'neuroshader'

let idCounter = 0
function nextId(type: string): string {
  idCounter += 1
  return `${type}-${idCounter}`
}

/** Deep clone a config (plain JSON data) so subscribers see a fresh reference. */
function clone(config: NeuroConfig): NeuroConfig {
  return structuredClone(config)
}

/** Ensure every effect carries a stable id (the editor keys/selects on it). */
function normalize(config: NeuroConfig): NeuroConfig {
  const next = clone(config)
  for (const layer of LAYER_ORDER) {
    const lc = next.layers[layer]
    if (!lc) continue
    for (const effect of lc.effects) {
      effect.id ??= nextId(effect.type)
    }
  }
  return next
}

function ensureLayer(config: NeuroConfig, layer: LayerId): LayerConfig {
  let lc = config.layers[layer]
  if (!lc) {
    lc = { effects: [] }
    config.layers[layer] = lc
  }
  return lc
}

interface EditorState {
  config: NeuroConfig
  selectedId: string | null
  select: (id: string | null) => void
  addEffect: (layer: LayerId, type: string) => void
  removeEffect: (layer: LayerId, id: string) => void
  moveEffect: (layer: LayerId, id: string, dir: -1 | 1) => void
  toggleEffect: (layer: LayerId, id: string) => void
  toggleLayer: (layer: LayerId) => void
}

export const useEditor = create<EditorState>()((set) => ({
  config: normalize(defaultPreset),
  selectedId: null,

  select: (id) => set({ selectedId: id }),

  addEffect: (layer, type) =>
    set((state) => {
      const config = clone(state.config)
      const instance: EffectInstanceConfig = {
        type,
        id: nextId(type),
        enabled: true,
        params: {},
      }
      ensureLayer(config, layer).effects.push(instance)
      return { config, selectedId: instance.id ?? null }
    }),

  removeEffect: (layer, id) =>
    set((state) => {
      const config = clone(state.config)
      const lc = config.layers[layer]
      if (lc) lc.effects = lc.effects.filter((e) => e.id !== id)
      return {
        config,
        selectedId: state.selectedId === id ? null : state.selectedId,
      }
    }),

  moveEffect: (layer, id, dir) =>
    set((state) => {
      const config = clone(state.config)
      const effects = config.layers[layer]?.effects
      if (effects) {
        const i = effects.findIndex((e) => e.id === id)
        const j = i + dir
        if (i >= 0 && j >= 0 && j < effects.length) {
          const tmp = effects[i]
          effects[i] = effects[j]
          effects[j] = tmp
        }
      }
      return { config }
    }),

  toggleEffect: (layer, id) =>
    set((state) => {
      const config = clone(state.config)
      const effect = config.layers[layer]?.effects.find((e) => e.id === id)
      if (effect) effect.enabled = effect.enabled === false
      return { config }
    }),

  toggleLayer: (layer) =>
    set((state) => {
      const config = clone(state.config)
      const lc = ensureLayer(config, layer)
      lc.enabled = lc.enabled === false
      return { config }
    }),
}))
