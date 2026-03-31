export const MAP_SIZE = 100;
export const MAP_HALF = 50;

export const BUILDINGS: Array<{ pos: [number, number, number]; size: [number, number, number]; color: string }> = [
  { pos: [15, 2, 15], size: [8, 4, 6], color: '#1a1a3a' },
  { pos: [-20, 2.5, -15], size: [10, 5, 8], color: '#1c1c38' },
  { pos: [25, 2, -20], size: [6, 4, 6], color: '#1a1a3a' },
  { pos: [-15, 2, 20], size: [7, 4, 5], color: '#1e1e35' },
  { pos: [0, 2.5, -32], size: [12, 5, 8], color: '#181840' },
  { pos: [-32, 2, 0], size: [8, 4, 8], color: '#1a1a3a' },
  { pos: [35, 2, 10], size: [6, 4, 10], color: '#1c1c38' },
  { pos: [-10, 1.5, 35], size: [8, 3, 6], color: '#1e1e35' },
  { pos: [32, 2, 32], size: [7, 4, 7], color: '#181840' },
  { pos: [-35, 2, -30], size: [9, 4, 6], color: '#1a1a3a' },
];

export const COVER_WALLS: Array<{ pos: [number, number, number]; size: [number, number, number] }> = [
  { pos: [10, 1.5, -5], size: [0.3, 3, 6] },
  { pos: [-5, 1.5, 10], size: [4, 3, 0.3] },
  { pos: [22, 1, -35], size: [0.3, 2, 4] },
  { pos: [-25, 1, 30], size: [5, 2, 0.3] },
  { pos: [40, 1.5, -10], size: [0.3, 3, 5] },
  { pos: [-40, 1, -15], size: [4, 2, 0.3] },
  { pos: [5, 1, -20], size: [3, 2, 0.3] },
  { pos: [-15, 1.5, -5], size: [0.3, 3, 4] },
];

export const CRATES: Array<{ pos: [number, number, number]; size: [number, number, number] }> = [
  { pos: [5, 0.5, 5], size: [1, 1, 1] },
  { pos: [-8, 0.5, 3], size: [1.2, 1, 0.8] },
  { pos: [3, 0.5, -10], size: [0.8, 1, 1.2] },
  { pos: [-5, 0.5, -7], size: [1, 1, 1] },
  { pos: [28, 0.5, -12], size: [1, 1, 1.2] },
  { pos: [-18, 0.5, -25], size: [1.5, 1, 1] },
  { pos: [35, 0.5, 25], size: [1, 1, 1] },
  { pos: [-28, 0.5, 20], size: [1, 1.2, 1] },
  { pos: [12, 0.5, -38], size: [1, 1, 1] },
  { pos: [-38, 0.5, 12], size: [1.2, 1, 1.2] },
  { pos: [42, 0.5, -25], size: [1, 1, 1] },
  { pos: [-8, 0.5, -40], size: [1.5, 1, 1] },
];

export const NEON_LIGHTS: Array<{ pos: [number, number, number]; color: string }> = [
  { pos: [15, 6, 15], color: '#0066ff' },
  { pos: [-20, 6, -15], color: '#6600cc' },
  { pos: [0, 6, -32], color: '#0066ff' },
  { pos: [-32, 6, 0], color: '#6600cc' },
  { pos: [35, 6, 10], color: '#0044cc' },
  { pos: [-10, 5, 35], color: '#6600cc' },
  { pos: [32, 6, 32], color: '#0066ff' },
  { pos: [-35, 6, -30], color: '#6600cc' },
];
