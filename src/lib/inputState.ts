export const inputState = {
  moveX: 0,
  moveZ: 0,
  lookDeltaX: 0,
  lookDeltaY: 0,
  isFiring: false,
  jumpPressed: false,
  crouching: false,
  reloadPressed: false,
  switchWeapon: -1,
  useHealthKit: false,
  toggleInventory: false,
};

export const playerState = {
  x: 0,
  y: 1.6,
  z: 0,
  forwardX: 0,
  forwardY: 0,
  forwardZ: -1,
};

export const minimapData = {
  enemies: [] as Array<{ x: number; z: number }>,
  loot: [] as Array<{ x: number; z: number; type: string }>,
};
