export interface WeaponDef {
  id: string;
  name: string;
  damage: number;
  fireRate: number;
  maxAmmo: number;
  reloadTime: number;
  bulletSpeed: number;
  color: string;
}

export const WEAPONS: Record<string, WeaponDef> = {
  pistol: { id: 'pistol', name: 'Pistol', damage: 10, fireRate: 0.25, maxAmmo: 15, reloadTime: 1.2, bulletSpeed: 45, color: '#00ccff' },
  smg: { id: 'smg', name: 'SMG', damage: 7, fireRate: 0.08, maxAmmo: 35, reloadTime: 1.8, bulletSpeed: 50, color: '#00ffaa' },
  shotgun: { id: 'shotgun', name: 'Shotgun', damage: 30, fireRate: 0.9, maxAmmo: 8, reloadTime: 2.5, bulletSpeed: 35, color: '#ff6600' },
  rifle: { id: 'rifle', name: 'Rifle', damage: 18, fireRate: 0.15, maxAmmo: 25, reloadTime: 2.0, bulletSpeed: 60, color: '#cc00ff' },
};

export interface InventoryWeapon {
  weaponId: string;
  ammo: number;
}

export type LootType = 'weapon' | 'ammo' | 'healthkit';

export interface LootData {
  id: string;
  type: LootType;
  weaponId?: string;
  pos: [number, number, number];
}
