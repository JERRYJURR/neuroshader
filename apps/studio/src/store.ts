import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import { defaultPreset, LAYER_ORDER } from 'neuroshader'
import type {
  EffectInstanceConfig,
  LayerConfig,
  LayerId,
  NeuroConfig,
  NeuroShader,
} from 'neuroshader'

function nextId(type: string): string {
  return `${type}-${Math.random().toString(36).slice(2, 8)}`
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

/** localStorage, but writes are debounced so slider drags don't thrash it. */
function debouncedStorage(delay = 400): StateStorage {
  let timer: ReturnType<typeof setTimeout> | undefined
  return {
    getItem: (name) => localStorage.getItem(name),
    setItem: (name, value) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => localStorage.setItem(name, value), delay)
    },
    removeItem: (name) => localStorage.removeItem(name),
  }
}

interface EditorState {
  config: NeuroConfig
  selectedId: string | null
  engine: NeuroShader | null
  setEngine: (engine: NeuroShader | null) => void
  select: (id: string | null) => void
  addEffect: (layer: LayerId, type: string) => void
  removeEffect: (layer: LayerId, id: string) => void
  moveEffect: (layer: LayerId, id: string, dir: -1 | 1) => void
  toggleEffect: (layer: LayerId, id: string) => void
  toggleLayer: (layer: LayerId) => void
  updateParam: (layer: LayerId, id: string, key: string, value: unknown) => void
  loadConfig: (config: NeuroConfig) => void
  reset: () => void
}

export const useEditor = create<EditorState>()(
  persist(
    (set, get) => ({
      config: normalize(defaultPreset),
      selectedId: null,
      engine: null,

      setEngine: (engine) => set({ engine }),
      select: (id) => set({ selectedId: id }),

      addEffect: (layer, type) => {
        const config = clone(get().config)
        const instance: EffectInstanceConfig = {
          type,
          id: nextId(type),
          enabled: true,
          params: {},
        }
        ensureLayer(config, layer).effects.push(instance)
        get().engine?.setConfig(config)
        set({ config, selectedId: instance.id ?? null })
      },

      removeEffect: (layer, id) => {
        const config = clone(get().config)
        const lc = config.layers[layer]
        if (lc) lc.effects = lc.effects.filter((e) => e.id !== id)
        get().engine?.setConfig(config)
        set({ config, selectedId: get().selectedId === id ? null : get().selectedId })
      },

      moveEffect: (layer, id, dir) => {
        const config = clone(get().config)
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
        get().engine?.setConfig(config)
        set({ config })
      },

      toggleEffect: (layer, id) => {
        const config = clone(get().config)
        const effect = config.layers[layer]?.effects.find((e) => e.id === id)
        if (effect) effect.enabled = effect.enabled === false
        get().engine?.setConfig(config)
        set({ config })
      },

      toggleLayer: (layer) => {
        const config = clone(get().config)
        const lc = ensureLayer(config, layer)
        lc.enabled = lc.enabled === false
        get().engine?.setConfig(config)
        set({ config })
      },

      updateParam: (layer, id, key, value) => {
        const config = clone(get().config)
        const effect = config.layers[layer]?.effects.find((e) => e.id === id)
        if (!effect) return
        effect.params = { ...effect.params, [key]: value }

        const engine = get().engine
        if (engine) {
          // Try a live in-place update; fall back to a rebuild if unsupported.
          const applied = engine.updateParams(id, { [key]: value })
          if (!applied) engine.setConfig(config)
        }
        set({ config })
      },

      loadConfig: (incoming) => {
        const config = normalize(incoming)
        get().engine?.setConfig(config)
        set({ config, selectedId: null })
      },

      reset: () => {
        const config = normalize(defaultPreset)
        get().engine?.setConfig(config)
        set({ config, selectedId: null })
      },
    }),
    {
      name: 'neuroshader-studio',
      version: 1,
      storage: createJSONStorage(debouncedStorage),
      // Persist only the document; the engine + selection are runtime state.
      partialize: (state) => ({ config: state.config }),
    },
  ),
)
