import type { NeuroConfig } from '../types'

/**
 * The "Neural Scan" hero preset — the v1 default.
 *
 * NOTE: in M1 the runtime renders a fixed bootstrap scene and ignores the
 * `layers` effects below. This object is the *target* config that M2 wires up
 * (one manifest per effect type). It doubles as living documentation of the
 * config shape and the param names the inspector will drive.
 */
export const defaultPreset: NeuroConfig = {
  version: 1,
  meta: { name: 'Neural Scan', neuroshader: '0.1.0' },
  background: '#05070a',
  camera: { fov: 45, position: [0, 0, 5], target: [0, 0, 0] },
  layers: {
    scene: {
      effects: [
        { type: 'background', params: { color: '#05070a' } },
        {
          type: 'ambientLight',
          params: { color: '#1a3a44', intensity: 0.5 },
        },
        {
          type: 'directionalLight',
          params: {
            color: '#bfefff',
            intensity: 5,
            position: [4, 6, 5],
            castShadow: true,
          },
        },
        {
          type: 'backdrop',
          params: { color: '#0c1a20', roughness: 0.8, metalness: 0.1, height: -1.4 },
        },
      ],
    },
    object: {
      effects: [
        {
          type: 'primitive',
          params: {
            shape: 'box',
            size: 1.6,
            color: '#3f93a6',
            metalness: 0.15,
            roughness: 0.5,
            spinX: 0.35,
            spinY: 0.55,
          },
        },
      ],
    },
    distortion: {
      effects: [{ type: 'lensDistort', params: { strength: 0.35 } }],
    },
    filter: {
      effects: [
        { type: 'posterize', params: { levels: 6 } },
        { type: 'findEdges', params: { intensity: 1.5 } },
      ],
    },
    blurGlow: {
      effects: [
        { type: 'bloom', params: { intensity: 1.4, threshold: 0.15, radius: 0.7 } },
      ],
    },
    post: {
      effects: [
        { type: 'noise', params: { amount: 0.05 } },
        {
          type: 'colorOverlay',
          params: { color: '#38e1ff', blend: 'multiply', opacity: 1 },
        },
      ],
    },
  },
}
