import { useState } from 'react'
import { byteSize, copyText, downloadText, exportJSON, usageSnippet } from '../lib/export'
import { useEditor } from '../store'

function slug(name: string | undefined): string {
  const s = (name ?? 'neuroshader')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return s || 'neuroshader'
}

export function ExportDialog({ onClose }: { onClose: () => void }) {
  const config = useEditor((s) => s.config)
  const [copied, setCopied] = useState<string | null>(null)

  const json = exportJSON(config)
  const snippet = usageSnippet()
  const name = slug(config.meta?.name)

  const copy = async (label: string, text: string) => {
    await copyText(text)
    setCopied(label)
    setTimeout(() => setCopied((c) => (c === label ? null : c)), 1200)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span>Export · {config.meta?.name ?? 'Untitled'}</span>
          <button className="modal-close" onClick={onClose} title="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-intro">
            Install the runtime, drop in this config, and render exactly what you
            see here — anywhere.
          </p>

          <section className="xsec">
            <div className="xsec-head">
              <span className="xstep">1</span> Install
            </div>
            <pre className="code">npm install neuroshader</pre>
          </section>

          <section className="xsec">
            <div className="xsec-head">
              <span className="xstep">2</span> Config
              <span className="muted-inline">
                {name}.json · {byteSize(json)} bytes
              </span>
              <span className="grow" />
              <button onClick={() => copy('json', json)}>
                {copied === 'json' ? 'Copied' : 'Copy'}
              </button>
              <button className="primary" onClick={() => downloadText(`${name}.json`, json)}>
                Download
              </button>
            </div>
            <pre className="code scroll">{json}</pre>
          </section>

          <section className="xsec">
            <div className="xsec-head">
              <span className="xstep">3</span> Render
              <span className="grow" />
              <button onClick={() => copy('snippet', snippet)}>
                {copied === 'snippet' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="code">{snippet}</pre>
          </section>
        </div>
      </div>
    </div>
  )
}
