import { useRef, useReducer, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { inputState, playerState, minimapData } from '@/lib/inputState';
import { useGameStore } from '@/stores/gameStore';
import { WEAPONS, type LootData } from '@/lib/gameTypes';
import { MAP_HALF } from '@/lib/mapData';
import Environment from './Environment';

interface BulletData {
  id: string;
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  speed: number;
  damage: number;
  age: number;
  isEnemy: boolean;
}

interface EnemyData {
  id: string;
  pos: THREE.Vector3;
  health: number;
  maxHealth: number;
  shootTimer: number;
}

let nextId = 0;
const BOUND = MAP_HALF - 1;

const GameWorld = () => {
  const { camera } = useThree();
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const bullets = useRef<BulletData[]>([]);
  const enemies = useRef<EnemyData[]>([]);
  const loot = useRef<LootData[]>([]);
  const bulletMeshes = useRef(new Map<string, THREE.Mesh>());
  const enemyGroups = useRef(new Map<string, THREE.Group>());
  const lootGroups = useRef(new Map<string, THREE.Group>());
  const safeZoneRef = useRef<THREE.Mesh>(null);

  const playerPos = useRef(new THREE.Vector3(0, 1.6, 0));
  const playerEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const vel = useRef(new THREE.Vector3());
  const onGround = useRef(true);
  const keys = useRef(new Set<string>());
  const justPressed = useRef(new Set<string>());
  const mouseDown = useRef(false);
  const shootCD = useRef(0);
  const spawnTimer = useRef(2);
  const lootTimer = useRef(5);
  const safeZoneTimer = useRef(45);
  const reloadTimer = useRef(0);
  const zoneDmgAccum = useRef(0);

  const renderBullets = useRef<BulletData[]>([]);
  const renderEnemies = useRef<EnemyData[]>([]);
  const renderLoot = useRef<LootData[]>([]);
  const renderSafeR = useRef(48);

  const gameOver = useGameStore((s) => s.gameOver);
  const started = useGameStore((s) => s.started);

  useEffect(() => {
    if (!gameOver && started) {
      bullets.current = [];
      enemies.current = [];
      loot.current = [];
      renderBullets.current = [];
      renderEnemies.current = [];
      renderLoot.current = [];
      playerPos.current.set(0, 1.6, 0);
      playerEuler.current.set(0, 0, 0);
      vel.current.set(0, 0, 0);
      spawnTimer.current = 2;
      lootTimer.current = 5;
      safeZoneTimer.current = 45;
      reloadTimer.current = 0;
      zoneDmgAccum.current = 0;
      nextId = 0;
      forceUpdate();
    }
  }, [gameOver, started]);

  useEffect(() => {
    const onKD = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      justPressed.current.add(e.code);
      if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'KeyI'].includes(e.code))
        e.preventDefault();
    };
    const onKU = (e: KeyboardEvent) => keys.current.delete(e.code);
    const canvas = document.querySelector('canvas');
    const onClick = () => {
      if (!('ontouchstart' in window) && !document.pointerLockElement) canvas?.requestPointerLock();
    };
    const onMD = (e: MouseEvent) => { if (document.pointerLockElement && e.button === 0) mouseDown.current = true; };
    const onMU = (e: MouseEvent) => { if (e.button === 0) mouseDown.current = false; };
    const onMM = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        playerEuler.current.y -= e.movementX * 0.002;
        playerEuler.current.x = Math.max(-1.4, Math.min(1.4, playerEuler.current.x - e.movementY * 0.002));
      }
    };
    const onPLC = () => { if (!document.pointerLockElement) mouseDown.current = false; };

    window.addEventListener('keydown', onKD);
    window.addEventListener('keyup', onKU);
    canvas?.addEventListener('click', onClick);
    document.addEventListener('mousedown', onMD);
    document.addEventListener('mouseup', onMU);
    document.addEventListener('mousemove', onMM);
    document.addEventListener('pointerlockchange', onPLC);
    return () => {
      window.removeEventListener('keydown', onKD);
      window.removeEventListener('keyup', onKU);
      canvas?.removeEventListener('click', onClick);
      document.removeEventListener('mousedown', onMD);
      document.removeEventListener('mouseup', onMU);
      document.removeEventListener('mousemove', onMM);
      document.removeEventListener('pointerlockchange', onPLC);
    };
  }, []);

  useFrame((_, rawDelta) => {
    const store = useGameStore.getState();
    if (!store.started || store.gameOver) return;
    const d = Math.min(rawDelta, 0.05);
    let dirty = false;
    const jp = justPressed.current;

    // ── ONE-SHOT KEYS ──
    if (jp.has('Digit1') || inputState.switchWeapon === 0) { store.switchWeapon(0); inputState.switchWeapon = -1; }
    if (jp.has('Digit2') || inputState.switchWeapon === 1) { store.switchWeapon(1); inputState.switchWeapon = -1; }
    if (jp.has('KeyH') || inputState.useHealthKit) { store.useHealthKit(); inputState.useHealthKit = false; }
    if (jp.has('KeyI') || jp.has('Tab') || inputState.toggleInventory) { store.toggleInventory(); inputState.toggleInventory = false; }
    jp.clear();

    // ── PLAYER MOVEMENT ──
    const kx = (keys.current.has('KeyD') || keys.current.has('ArrowRight') ? 1 : 0) - (keys.current.has('KeyA') || keys.current.has('ArrowLeft') ? 1 : 0);
    const kz = (keys.current.has('KeyW') || keys.current.has('ArrowUp') ? 1 : 0) - (keys.current.has('KeyS') || keys.current.has('ArrowDown') ? 1 : 0);
    const mx = kx + inputState.moveX;
    const mz = kz + inputState.moveZ;

    playerEuler.current.y -= inputState.lookDeltaX * 0.004;
    playerEuler.current.x = Math.max(-1.4, Math.min(1.4, playerEuler.current.x - inputState.lookDeltaY * 0.004));
    inputState.lookDeltaX = 0;
    inputState.lookDeltaY = 0;

    const speed = keys.current.has('ShiftLeft') ? 8 : 4;
    const crouching = keys.current.has('KeyC') || inputState.crouching;
    const targetH = crouching ? 1.0 : 1.6;
    const yaw = playerEuler.current.y;
    const fX = -Math.sin(yaw), fZ = -Math.cos(yaw), rX = Math.cos(yaw), rZ = -Math.sin(yaw);
    let dx = fX * mz + rX * mx, dz = fZ * mz + rZ * mx;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) { dx /= len; dz /= len; }

    playerPos.current.x = Math.max(-BOUND, Math.min(BOUND, playerPos.current.x + dx * speed * d));
    playerPos.current.z = Math.max(-BOUND, Math.min(BOUND, playerPos.current.z + dz * speed * d));

    if ((keys.current.has('Space') || inputState.jumpPressed) && onGround.current) {
      vel.current.y = 7; onGround.current = false; inputState.jumpPressed = false;
    }
    vel.current.y -= 20 * d;
    playerPos.current.y += vel.current.y * d;
    if (playerPos.current.y <= targetH) { playerPos.current.y = targetH; vel.current.y = 0; onGround.current = true; }

    camera.position.copy(playerPos.current);
    camera.rotation.copy(playerEuler.current);
    const fwd = new THREE.Vector3(0, 0, -1).applyEuler(playerEuler.current);
    playerState.x = playerPos.current.x;
    playerState.y = playerPos.current.y;
    playerState.z = playerPos.current.z;
    playerState.forwardX = fwd.x;
    playerState.forwardY = fwd.y;
    playerState.forwardZ = fwd.z;

    // ── WEAPON / SHOOTING ──
    const activeWep = store.weapons[store.activeSlot];
    const wepDef = activeWep ? WEAPONS[activeWep.weaponId] : null;

    // Reload
    if (store.isReloading) {
      reloadTimer.current -= d;
      if (reloadTimer.current <= 0) { store.finishReload(); reloadTimer.current = 0; }
    } else if (wepDef && activeWep) {
      if ((keys.current.has('KeyR') || inputState.reloadPressed) && activeWep.ammo < wepDef.maxAmmo) {
        store.startReload();
        reloadTimer.current = wepDef.reloadTime;
        inputState.reloadPressed = false;
      }
      if (activeWep.ammo <= 0) {
        store.startReload();
        reloadTimer.current = wepDef.reloadTime;
      }
    }

    shootCD.current -= d;
    const firing = mouseDown.current || inputState.isFiring;
    if (firing && shootCD.current <= 0 && wepDef && activeWep && activeWep.ammo > 0 && !store.isReloading) {
      if (store.useAmmo()) {
        shootCD.current = wepDef.fireRate;
        bullets.current.push({
          id: `b${nextId++}`, pos: playerPos.current.clone(), dir: fwd.clone(),
          speed: wepDef.bulletSpeed, damage: wepDef.damage, age: 0, isEnemy: false,
        });
        dirty = true;
      }
    }

    // ── BULLETS ──
    const prevBC = bullets.current.length;
    bullets.current = bullets.current.filter((b) => {
      b.pos.addScaledVector(b.dir, b.speed * d);
      b.age += d;
      const mesh = bulletMeshes.current.get(b.id);
      if (mesh) mesh.position.copy(b.pos);

      if (!b.isEnemy) {
        for (const e of enemies.current) {
          if (b.pos.distanceTo(e.pos) < 1.2) { 
            const prevHealth = e.health;
            e.health -= b.damage; 
            // Trigger hit event for visual feedback
            if (e.health <= 0 && prevHealth > 0) {
              window.dispatchEvent(new CustomEvent('enemyHit', { 
                detail: { x: Math.random() * 100 - 50, y: Math.random() * 100 - 50 } 
              }));
              // Trigger kill event for kill counter
              window.dispatchEvent(new CustomEvent('enemyKill', {
                detail: { enemyId: e.id }
              }));
            }
            return false; 
          }
        }
      } else {
        if (b.pos.distanceTo(playerPos.current) < 1) { store.damagePlayer(b.damage); return false; }
      }
      return b.age < 3;
    });
    if (bullets.current.length !== prevBC) dirty = true;

    // ── ENEMIES ──
    const prevEC = enemies.current.length;
    enemies.current = enemies.current.filter((e) => {
      if (e.health <= 0) { store.addScore(100); return false; }
      const ex = playerPos.current.x - e.pos.x, ez = playerPos.current.z - e.pos.z;
      const dist = Math.sqrt(ex * ex + ez * ez);
      if (dist > 2) {
        e.pos.x = Math.max(-BOUND, Math.min(BOUND, e.pos.x + (ex / dist) * 2.5 * d));
        e.pos.z = Math.max(-BOUND, Math.min(BOUND, e.pos.z + (ez / dist) * 2.5 * d));
      }
      const grp = enemyGroups.current.get(e.id);
      if (grp) { grp.position.copy(e.pos); grp.lookAt(playerPos.current.x, e.pos.y, playerPos.current.z); }

      e.shootTimer -= d;
      if (e.shootTimer <= 0 && dist < 25) {
        e.shootTimer = 1.5 + Math.random() * 2;
        const dir = new THREE.Vector3(ex / dist, (playerPos.current.y - e.pos.y) / dist, ez / dist).normalize();
        bullets.current.push({
          id: `b${nextId++}`, pos: e.pos.clone().add(new THREE.Vector3(0, 1, 0)),
          dir, speed: 20, damage: 8, age: 0, isEnemy: true,
        });
        dirty = true;
      }
      return true;
    });
    if (enemies.current.length !== prevEC) dirty = true;

    // ── SPAWN ENEMIES ──
    spawnTimer.current -= d;
    const szr = store.safeZoneRadius;
    if (spawnTimer.current <= 0 && enemies.current.length < 10) {
      spawnTimer.current = 2 + Math.random() * 3;
      const angle = Math.random() * Math.PI * 2;
      const sDist = Math.min(15 + Math.random() * 15, szr - 2);
      enemies.current.push({
        id: `e${nextId++}`,
        pos: new THREE.Vector3(Math.cos(angle) * sDist, 1, Math.sin(angle) * sDist),
        health: 30, maxHealth: 30, shootTimer: 2 + Math.random() * 2,
      });
      dirty = true;
    }

    // ── LOOT SPAWN ──
    lootTimer.current -= d;
    if (lootTimer.current <= 0 && loot.current.length < 15) {
      lootTimer.current = 8 + Math.random() * 7;
      const angle = Math.random() * Math.PI * 2;
      const lDist = 5 + Math.random() * Math.max(5, szr - 8);
      const rand = Math.random();
      const type = rand < 0.25 ? 'weapon' as const : rand < 0.6 ? 'ammo' as const : 'healthkit' as const;
      const weaponIds = ['smg', 'shotgun', 'rifle'];
      loot.current.push({
        id: `l${nextId++}`, type,
        weaponId: type === 'weapon' ? weaponIds[Math.floor(Math.random() * 3)] : undefined,
        pos: [Math.cos(angle) * lDist, 0.5, Math.sin(angle) * lDist],
      });
      dirty = true;
    }

    // ── LOOT PICKUP ──
    const prevLC = loot.current.length;
    loot.current = loot.current.filter((l) => {
      const ddx = playerPos.current.x - l.pos[0], ddz = playerPos.current.z - l.pos[2];
      if (Math.sqrt(ddx * ddx + ddz * ddz) < 2.5) {
        if (l.type === 'weapon') {
          store.addWeapon(l.weaponId!);
          store.setPickupMessage(`Picked up ${WEAPONS[l.weaponId!].name}`);
        } else if (l.type === 'ammo') {
          store.addAmmo(15);
          store.setPickupMessage('Picked up Ammo');
        } else {
          store.addHealthKit();
          store.setPickupMessage('Picked up Health Kit');
        }
        setTimeout(() => store.setPickupMessage(null), 2000);
        return false;
      }
      return true;
    });
    if (loot.current.length !== prevLC) dirty = true;

    // ── LOOT MESH UPDATE ──
    const now = Date.now();
    loot.current.forEach((l) => {
      const grp = lootGroups.current.get(l.id);
      if (grp) {
        grp.rotation.y += d * 2;
        grp.position.y = 0.5 + Math.sin(now * 0.003 + parseInt(l.id.slice(1)) * 0.7) * 0.15;
      }
    });

    // ── SAFE ZONE ──
    safeZoneTimer.current -= d;
    if (safeZoneTimer.current <= 0) {
      safeZoneTimer.current = 45;
      const newR = Math.max(8, szr - 6);
      store.setSafeZoneRadius(newR);
    }
    const pDist = Math.sqrt(playerPos.current.x ** 2 + playerPos.current.z ** 2);
    if (pDist > szr) {
      zoneDmgAccum.current += 5 * d;
      if (zoneDmgAccum.current >= 1) {
        store.damagePlayer(Math.floor(zoneDmgAccum.current));
        zoneDmgAccum.current %= 1;
      }
    } else {
      zoneDmgAccum.current = 0;
    }

    // Update safe zone visual
    renderSafeR.current = szr;
    if (safeZoneRef.current) {
      safeZoneRef.current.scale.set(szr, szr, szr);
    }

    // ── MINIMAP DATA ──
    minimapData.enemies = enemies.current.map((e) => ({ x: e.pos.x, z: e.pos.z }));
    minimapData.loot = loot.current.map((l) => ({ x: l.pos[0], z: l.pos[2], type: l.type }));

    if (dirty) {
      renderBullets.current = [...bullets.current];
      renderEnemies.current = [...enemies.current];
      renderLoot.current = [...loot.current];
      forceUpdate();
    }
  });

  return (
    <>
      <Environment />

      {/* Safe zone ring */}
      <mesh ref={safeZoneRef} position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.015, 8, 128]} />
        <meshBasicMaterial color="#0088ff" transparent opacity={0.7} />
      </mesh>

      {/* Bullets */}
      {renderBullets.current.map((b) => (
        <mesh key={b.id} ref={(r) => { if (r) bulletMeshes.current.set(b.id, r); else bulletMeshes.current.delete(b.id); }}>
          <sphereGeometry args={[0.08, 6, 6]} />
          <meshStandardMaterial
            color={b.isEnemy ? '#ff4444' : '#00ccff'}
            emissive={b.isEnemy ? '#ff0000' : '#0088ff'}
            emissiveIntensity={3}
          />
        </mesh>
      ))}

      {/* Enemies */}
      {renderEnemies.current.map((e) => (
        <group key={e.id} ref={(r) => { if (r) enemyGroups.current.set(e.id, r); else enemyGroups.current.delete(e.id); }}>
          <mesh position={[0, 0.7, 0]} castShadow>
            <boxGeometry args={[0.7, 1.2, 0.5]} />
            <meshStandardMaterial color="#cc2222" />
          </mesh>
          <mesh position={[0, 1.5, 0]} castShadow>
            <sphereGeometry args={[0.25, 8, 8]} />
            <meshStandardMaterial color="#dd4444" />
          </mesh>
          <mesh position={[-0.55, 0.6, 0]} castShadow>
            <boxGeometry args={[0.2, 0.8, 0.2]} />
            <meshStandardMaterial color="#bb2222" />
          </mesh>
          <mesh position={[0.55, 0.6, 0]} castShadow>
            <boxGeometry args={[0.2, 0.8, 0.2]} />
            <meshStandardMaterial color="#bb2222" />
          </mesh>
          <mesh position={[0, 2.1, 0]}>
            <planeGeometry args={[0.8, 0.1]} />
            <meshBasicMaterial color="#111111" />
          </mesh>
          <mesh position={[-(1 - e.health / e.maxHealth) * 0.4, 2.1, 0.01]} scale={[Math.max(0.01, e.health / e.maxHealth), 1, 1]}>
            <planeGeometry args={[0.8, 0.08]} />
            <meshBasicMaterial color={e.health > 15 ? '#44cc44' : '#cc4444'} />
          </mesh>
        </group>
      ))}

      {/* Loot */}
      {renderLoot.current.map((l) => (
        <group key={l.id} position={[l.pos[0], l.pos[1], l.pos[2]]}
          ref={(r) => { if (r) lootGroups.current.set(l.id, r); else lootGroups.current.delete(l.id); }}>
          {l.type === 'weapon' && (
            <mesh>
              <boxGeometry args={[0.4, 0.2, 0.7]} />
              <meshStandardMaterial color={WEAPONS[l.weaponId!].color} emissive={WEAPONS[l.weaponId!].color} emissiveIntensity={0.8} />
            </mesh>
          )}
          {l.type === 'ammo' && (
            <mesh>
              <boxGeometry args={[0.3, 0.2, 0.3]} />
              <meshStandardMaterial color="#ffcc00" emissive="#ff9900" emissiveIntensity={0.6} />
            </mesh>
          )}
          {l.type === 'healthkit' && (
            <group>
              <mesh>
                <boxGeometry args={[0.35, 0.15, 0.35]} />
                <meshStandardMaterial color="#00ff88" emissive="#00cc66" emissiveIntensity={0.6} />
              </mesh>
              <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[0.25, 0.04, 0.07]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[0.07, 0.04, 0.25]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          )}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
            <ringGeometry args={[0.3, 0.5, 16]} />
            <meshBasicMaterial
              color={l.type === 'weapon' ? (WEAPONS[l.weaponId!]?.color || '#cc00ff') : l.type === 'ammo' ? '#ffcc00' : '#00ff88'}
              transparent opacity={0.25} side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </>
  );
};

export default GameWorld;
