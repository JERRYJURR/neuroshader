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
        {
          type: 'ambientLight',
          params: { color: '#152a33', intensity: 1.2 },
        },
        {
          type: 'directionalLight',
          params: {
            color: '#8fdfff',
            intensity: 3,
            position: [4, 6, 5],
            castShadow: true,
          },
        },
        { type: 'shadowGround', params: { opacity: 0.55, y: -1.4 } },
      ],
    },
    object: {
      effects: [
        {
          type: 'primitive',
          params: {
            shape: 'box',
            size: 1.6,
            color: '#0e2a33',
            metalness: 0.6,
            roughness: 0.25,
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
        { type: 'findEdges', params: { intensity: 0.8 } },
      ],
    },
    blurGlow: {
      effects: [
        { type: 'bloom', params: { intensity: 1.1, threshold: 0.2, radius: 0.6 } },
      ],
    },
    post: {
      effects: [
        { type: 'noise', params: { amount: 0.08 } },
        {
          type: 'colorOverlay',
          params: { color: '#0bd1e6', blend: 'screen', opacity: 0.18 },
        },
      ],
    },
  },
}
