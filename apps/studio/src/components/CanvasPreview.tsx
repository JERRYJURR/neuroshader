import { useEffect, useRef } from 'react'
import { createNeuroShader } from 'neuroshader'
import { useEditor } from '../store'

export function CanvasPreview() {
  const hostRef = useRef<HTMLDivElement>(null)
  const setEngine = useEditor((s) => s.setEngine)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    // Create the runtime against the current config and register it so the
    // store can drive it (setConfig for structure, updateParams for live edits).
    const ns = createNeuroShader(host, useEditor.getState().config)
    ns.start()
    setEngine(ns)

    return () => {
      ns.dispose()
      if (useEditor.getState().engine === ns) setEngine(null)
    }
  }, [setEngine])

  return <div className="canvas-host" ref={hostRef} />
}
