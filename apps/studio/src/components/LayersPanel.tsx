import { useState } from 'react'
import { builtinEffects, LAYER_ORDER } from 'neuroshader'
import type { EffectInstanceConfig, LayerId } from 'neuroshader'
import { useEditor } from '../store'

const LAYER_LABELS: Record<LayerId, string> = {
  scene: 'Background / Scene',
  object: 'Object',
  distortion: 'Distortion',
  filter: 'Filter',
  blurGlow: 'Blur / Glow',
  post: 'Post Processing',
}

export function LayersPanel() {
  return (
    <div className="layers">
      <div className="panel-title">Layers</div>
      {LAYER_ORDER.map((layer) => (
        <LayerSection key={layer} layer={layer} />
      ))}
    </div>
  )
}

function LayerSection({ layer }: { layer: LayerId }) {
  const layerConfig = useEditor((s) => s.config.layers[layer])
  const toggleLayer = useEditor((s) => s.toggleLayer)
  const addEffect = useEditor((s) => s.addEffect)
  const [menuOpen, setMenuOpen] = useState(false)

  const effects = layerConfig?.effects ?? []
  const enabled = layerConfig?.enabled !== false
  const available = builtinEffects.filter((m) => m.layer === layer)

  return (
    <section className={`layer${enabled ? '' : ' is-off'}`}>
      <header className="layer-head">
        <button
          className="eye"
          title={enabled ? 'Disable layer' : 'Enable layer'}
          onClick={() => toggleLayer(layer)}
        >
          {enabled ? '◉' : '○'}
        </button>
        <span className="layer-name">{LAYER_LABELS[layer]}</span>
        <span className="layer-count">{effects.length}</span>
      </header>

      <div className="effects">
        {effects.map((effect, index) => (
          <EffectRow
            key={effect.id}
            layer={layer}
            effect={effect}
            index={index}
            count={effects.length}
          />
        ))}
        {effects.length === 0 && <div className="empty">empty</div>}
      </div>

      <div className="add">
        <button className="add-btn" onClick={() => setMenuOpen((o) => !o)}>
          + add effect
        </button>
        {menuOpen && (
          <div className="add-menu">
            {available.map((m) => (
              <button
                key={m.type}
                onClick={() => {
                  addEffect(layer, m.type)
                  setMenuOpen(false)
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function EffectRow({
  layer,
  effect,
  index,
  count,
}: {
  layer: LayerId
  effect: EffectInstanceConfig
  index: number
  count: number
}) {
  const selectedId = useEditor((s) => s.selectedId)
  const select = useEditor((s) => s.select)
  const toggleEffect = useEditor((s) => s.toggleEffect)
  const moveEffect = useEditor((s) => s.moveEffect)
  const removeEffect = useEditor((s) => s.removeEffect)

  const id = effect.id as string
  const manifest = builtinEffects.find((m) => m.type === effect.type)
  const enabled = effect.enabled !== false
  const selected = selectedId === id

  return (
    <div
      className={`row${selected ? ' is-sel' : ''}${enabled ? '' : ' is-off'}`}
      onClick={() => select(id)}
    >
      <button
        className="eye"
        title={enabled ? 'Disable' : 'Enable'}
        onClick={(e) => {
          e.stopPropagation()
          toggleEffect(layer, id)
        }}
      >
        {enabled ? '◉' : '○'}
      </button>
      <span className="row-name">{manifest?.label ?? effect.type}</span>
      <span className="row-actions">
        <button
          disabled={index === 0}
          title="Move up"
          onClick={(e) => {
            e.stopPropagation()
            moveEffect(layer, id, -1)
          }}
        >
          ↑
        </button>
        <button
          disabled={index === count - 1}
          title="Move down"
          onClick={(e) => {
            e.stopPropagation()
            moveEffect(layer, id, 1)
          }}
        >
          ↓
        </button>
        <button
          className="del"
          title="Remove"
          onClick={(e) => {
            e.stopPropagation()
            removeEffect(layer, id)
          }}
        >
          ✕
        </button>
      </span>
    </div>
  )
}
