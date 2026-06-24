import type { NeuroConfig } from 'neuroshader'

/**
 * Produce a clean, portable config: editor-only fields (effect `id`s) are
 * stripped. The runtime regenerates ids as needed, so the export stays minimal.
 */
export function toExportConfig(config: NeuroConfig): NeuroConfig {
  const out = structuredClone(config)
  for (const layer of Object.values(out.layers)) {
    if (!layer) continue
    for (const effect of layer.effects) delete effect.id
  }
  return out
}

export function exportJSON(config: NeuroConfig): string {
  return JSON.stringify(toExportConfig(config), null, 2)
}

/** Copy-paste snippet a consumer pastes to render this config via the library. */
export function usageSnippet(): string {
  return [
    "import { createNeuroShader } from 'neuroshader'",
    "import config from './neuroshader.json'",
    '',
    "const ns = createNeuroShader(document.querySelector('#canvas'), config)",
    'ns.start()',
  ].join('\n')
}

export function byteSize(text: string): number {
  return new Blob([text]).size
}

export function downloadText(
  filename: string,
  text: string,
  type = 'application/json',
): void {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard?.writeText(text)
}
