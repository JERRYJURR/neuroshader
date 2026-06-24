import { builtinEffects, LAYER_ORDER } from 'neuroshader'
import type { EffectInstanceConfig, LayerId } from 'neuroshader'
import { useEditor } from '../store'

export function Inspector() {
  const selectedId = useEditor((s) => s.selectedId)
  const config = useEditor((s) => s.config)

  let found: { layer: LayerId; effect: EffectInstanceConfig } | undefined
  for (const layer of LAYER_ORDER) {
    const effect = config.layers[layer]?.effects.find((e) => e.id === selectedId)
    if (effect) {
      found = { layer, effect }
      break
    }
  }

  if (!found) {
    return (
      <div className="inspector">
        <div className="panel-title">Inspector</div>
        <div className="empty pad">Select an effect to see its parameters.</div>
      </div>
    )
  }

  const { layer, effect } = found
  const manifest = builtinEffects.find((m) => m.type === effect.type)
  const schema = manifest?.params ?? {}
  const entries = Object.entries(schema)

  return (
    <div className="inspector">
      <div className="panel-title">Inspector</div>
      <div className="insp-head">
        <div className="insp-label">{manifest?.label ?? found.effect.type}</div>
        <div className="insp-type">
          {layer} · {effect.type}
        </div>
      </div>
      <div className="params">
        {entries.map(([key, spec]) => {
          const value = effect.params?.[key] ?? spec.default
          return (
            <div className="param" key={key}>
              <span className="param-label">{spec.label ?? key}</span>
              <span className="param-val">{JSON.stringify(value)}</span>
            </div>
          )
        })}
        {entries.length === 0 && <div className="empty pad">No parameters.</div>}
      </div>
      <div className="insp-note">Live editing controls arrive in M4.</div>
    </div>
  )
}
