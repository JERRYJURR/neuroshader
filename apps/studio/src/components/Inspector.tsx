import { builtinEffects, LAYER_ORDER } from 'neuroshader'
import type { EffectInstanceConfig, LayerId, ParamSpec } from 'neuroshader'
import { useEditor } from '../store'

function fmt(n: number): string {
  return String(Number(n.toFixed(3)))
}

function Control({
  label,
  spec,
  value,
  onChange,
}: {
  label: string
  spec: ParamSpec
  value: unknown
  onChange: (v: unknown) => void
}) {
  switch (spec.type) {
    case 'number':
      return (
        <label className="param">
          <span className="param-label">{label}</span>
          <span className="param-control">
            <input
              type="range"
              min={spec.min ?? 0}
              max={spec.max ?? 1}
              step={spec.step ?? 0.01}
              value={value as number}
              onChange={(e) => onChange(Number(e.target.value))}
            />
            <span className="param-num">{fmt(value as number)}</span>
          </span>
        </label>
      )
    case 'boolean':
      return (
        <label className="param">
          <span className="param-label">{label}</span>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
        </label>
      )
    case 'color':
      return (
        <label className="param">
          <span className="param-label">{label}</span>
          <span className="param-control">
            <input
              type="color"
              value={value as string}
              onChange={(e) => onChange(e.target.value)}
            />
            <span className="param-num">{value as string}</span>
          </span>
        </label>
      )
    case 'select':
      return (
        <label className="param">
          <span className="param-label">{label}</span>
          <select value={value as string} onChange={(e) => onChange(e.target.value)}>
            {spec.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )
    case 'vec2':
    case 'vec3': {
      const arr = (value as number[]) ?? spec.default
      return (
        <div className="param">
          <span className="param-label">{label}</span>
          <span className="param-control vec">
            {arr.map((n, i) => (
              <input
                key={i}
                type="number"
                step={0.1}
                value={n}
                onChange={(e) => {
                  const next = [...arr]
                  next[i] = Number(e.target.value)
                  onChange(next)
                }}
              />
            ))}
          </span>
        </div>
      )
    }
  }
}

export function Inspector() {
  const selectedId = useEditor((s) => s.selectedId)
  const config = useEditor((s) => s.config)
  const updateParam = useEditor((s) => s.updateParam)

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
        <div className="empty pad">Select an effect to edit its parameters.</div>
      </div>
    )
  }

  const { layer, effect } = found
  const id = effect.id as string
  const manifest = builtinEffects.find((m) => m.type === effect.type)
  const entries = Object.entries(manifest?.params ?? {})

  return (
    <div className="inspector">
      <div className="panel-title">Inspector</div>
      <div className="insp-head">
        <div className="insp-label">{manifest?.label ?? effect.type}</div>
        <div className="insp-type">
          {layer} · {effect.type}
        </div>
      </div>
      <div className="params">
        {entries.map(([key, spec]) => (
          <Control
            key={key}
            label={spec.label ?? key}
            spec={spec}
            value={effect.params?.[key] ?? spec.default}
            onChange={(v) => updateParam(layer, id, key, v)}
          />
        ))}
        {entries.length === 0 && <div className="empty pad">No parameters.</div>}
      </div>
    </div>
  )
}
