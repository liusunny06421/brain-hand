import type { BrainRegionData } from '../types/brain'

export const BRAIN_REGIONS: Record<string, BrainRegionData> = {
  left_hemisphere: {
    id: 'left_hemisphere',
    name: 'Left Hemisphere',
    description:
      'Controls the right side of the body. Dominant for language (Broca\'s & Wernicke\'s areas), logic, analytical thinking, and mathematical computation in most people.',
    color: '#d4a0a0',
    highlightColor: '#e8b4b4',
    explodeDirection: [-1, 0, 0],
    explodeDistance: 0.5,
  },
  right_hemisphere: {
    id: 'right_hemisphere',
    name: 'Right Hemisphere',
    description:
      'Controls the left side of the body. Specializes in spatial awareness, face recognition, music processing, emotional expression, and creative/intuitive thinking.',
    color: '#d4a0a0',
    highlightColor: '#e8b4b4',
    explodeDirection: [1, 0, 0],
    explodeDistance: 0.5,
  },
}
