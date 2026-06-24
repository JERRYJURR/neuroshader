import { useEffect, useRef } from 'react'
import { createNeuroShader } from 'neuroshader'
import type { NeuroShader } from 'neuroshader'
import { useEditor } from '../store'

export function CanvasPreview() {
  const hostRef = useRef<HTMLDivElement>(null)
  const nsRef = useRef<NeuroShader | null>(null)
  const config = useEditor((s) => s.config)

  // Create the runtime once, against the live config.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const ns = createNeuroShader(host, useEditor.getState().config)
    ns.start()
    nsRef.current = ns
    return () => {
      ns.dispose()
      nsRef.current = null
    }
  }, [])

  // Push every config change into the running engine.
  useEffect(() => {
    nsRef.current?.setConfig(config)
  }, [config])

  return <div className="canvas-host" ref={hostRef} />
}
