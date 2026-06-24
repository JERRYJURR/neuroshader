import type { ParamSchema, ParamValues } from './types'

/**
 * Merge an effect instance's stored param values over the manifest schema
 * defaults, so effect factories always receive a complete set of values.
 * Unknown keys present in `values` are passed through (forward-compatibility).
 */
export function resolveParams(
  schema: ParamSchema | undefined,
  values: ParamValues = {},
): ParamValues {
  const out: ParamValues = {}
  if (schema) {
    for (const [key, spec] of Object.entries(schema)) {
      out[key] = key in values ? values[key] : spec.default
    }
  }
  for (const key of Object.keys(values)) {
    if (!(key in out)) out[key] = values[key]
  }
  return out
}
