import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useEditor } from '../store'
import { ExportDialog } from './ExportDialog'

export function Toolbar() {
  const reset = useEditor((s) => s.reset)
  const loadConfig = useEditor((s) => s.loadConfig)
  const configName = useEditor((s) => s.config.meta?.name)
  const [exportOpen, setExportOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        loadConfig(JSON.parse(String(reader.result)))
      } catch {
        alert('That file is not a valid neuroshader config.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <header className="topbar">
      <div className="brand">
        neuro<span>shader</span>
        <em>studio</em>
      </div>
      <div className="doc-name">{configName ?? 'Untitled'}</div>
      <span className="grow" />
      <div className="actions">
        <button onClick={() => fileRef.current?.click()}>Import</button>
        <button
          onClick={() => {
            if (confirm('Reset to the default preset? Current edits will be lost.')) reset()
          }}
        >
          Reset
        </button>
        <button className="primary" onClick={() => setExportOpen(true)}>
          Export
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={onFile}
        />
      </div>
      {exportOpen && <ExportDialog onClose={() => setExportOpen(false)} />}
    </header>
  )
}
