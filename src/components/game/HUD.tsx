import { useGameStore } from '@/stores/gameStore';
import { WEAPONS } from '@/lib/gameTypes';
import { useEffect, useState, useRef } from 'react';

const HUD = () => {
  const health = useGameStore((s) => s.health);
  const score = useGameStore((s) => s.score);
  const gameOver = useGameStore((s) => s.gameOver);
  const started = useGameStore((s) => s.started);
  const weapons = useGameStore((s) => s.weapons);
  const activeSlot = useGameStore((s) => s.activeSlot);
  const healthKits = useGameStore((s) => s.healthKits);
  const isReloading = useGameStore((s) => s.isReloading);
  const safeZoneRadius = useGameStore((s) => s.safeZoneRadius);
  const pickupMessage = useGameStore((s) => s.pickupMessage);
  const restart = useGameStore((s) => s.restart);
  const start = useGameStore((s) => s.start);
  
  const [damageFlash, setDamageFlash] = useState(false);
  const [hitMarkers, setHitMarkers] = useState<Array<{id: number, x: number, y: number}>>([]);
  const [showDamage, setShowDamage] = useState<{show: boolean, damage: number}>({show: false, damage: 0});
  const [weaponSwitchAnimation, setWeaponSwitchAnimation] = useState(false);
  const [reloadAnimation, setReloadAnimation] = useState(false);
  
  const prevHealthRef = useRef(health);
  const prevSlotRef = useRef(activeSlot);

  // Damage flash effect
  useEffect(() => {
    if (health < prevHealthRef.current && health > 0) {
      setDamageFlash(true);
      setShowDamage({show: true, damage: Math.ceil(prevHealthRef.current - health)});
      setTimeout(() => setDamageFlash(false), 200);
      setTimeout(() => setShowDamage({show: false, damage: 0}), 1000);
    }
    prevHealthRef.current = health;
  }, [health]);

  // Weapon switch animation
  useEffect(() => {
    if (activeSlot !== prevSlotRef.current) {
      setWeaponSwitchAnimation(true);
      setTimeout(() => setWeaponSwitchAnimation(false), 300);
    }
    prevSlotRef.current = activeSlot;
  }, [activeSlot]);

  // Reload animation
  useEffect(() => {
    if (isReloading) {
      setReloadAnimation(true);
    } else {
      setReloadAnimation(false);
    }
  }, [isReloading]);

  // Hit marker effect (would need to be triggered from GameWorld)
  useEffect(() => {
    const handleHit = (event: CustomEvent) => {
      const newHit = {
        id: Date.now(),
        x: event.detail.x || Math.random() * 100 - 50,
        y: event.detail.y || Math.random() * 100 - 50
      };
      setHitMarkers(prev => [...prev, newHit]);
      setTimeout(() => {
        setHitMarkers(prev => prev.filter(hit => hit.id !== newHit.id));
      }, 300);
    };

    window.addEventListener('enemyHit', handleHit as EventListener);
    return () => window.removeEventListener('enemyHit', handleHit as EventListener);
  }, []);

  const isMobile = 'ontouchstart' in window;
  const activeWep = weapons[activeSlot];
  const wepDef = activeWep ? WEAPONS[activeWep.weaponId] : null;

  // Check if player is outside safe zone
  const outsideZone = Math.sqrt(
    (typeof window !== 'undefined' ? 0 : 0) // placeholder, actual check in GameWorld
  ) > safeZoneRadius;

  if (!started) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer select-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(10,10,40,0.95) 0%, rgba(5,5,16,0.98) 100%)' }}
        onClick={() => { start(); if (!isMobile) document.querySelector('canvas')?.requestPointerLock(); }}
      >
        <div className="relative">
          <h1 className="text-game-neon text-5xl md:text-7xl font-black mb-2 tracking-tight animate-pulse-neon gaming-text">
            BULLET
          </h1>
          <h2 className="text-game-neon-purple text-3xl md:text-5xl font-black mb-8 tracking-widest gaming-text animate-pulse-neon-purple">
            BUDDY
          </h2>
          <h3 className="text-game-neon text-2xl md:text-4xl font-black mb-8 tracking-widest gaming-text animate-pulse-neon">
            ARENA
          </h3>
        </div>
        <div className="relative">
          <p className="text-game-text text-lg md:text-xl mb-8 animate-pulse gaming-text">
            {isMobile ? '⚡ TAP TO START ⚡' : '⚡ CLICK TO PLAY ⚡'}
          </p>
          <div className="absolute inset-0 animate-pulse-neon" style={{ filter: 'blur(20px)', opacity: 0.5 }}></div>
        </div>
        {!isMobile && (
          <div className="gaming-panel p-4 rounded-lg text-game-text/60 text-xs space-y-2 text-center font-mono">
            <div className="flex justify-center gap-4">
              <span className="text-game-neon">MOVEMENT:</span>
              <span>WASD</span>
            </div>
            <div className="flex justify-center gap-4">
              <span className="text-game-neon">AIM:</span>
              <span>MOUSE</span>
            </div>
            <div className="flex justify-center gap-4">
              <span className="text-game-neon">SHOOT:</span>
              <span>CLICK</span>
            </div>
            <div className="flex justify-center gap-4">
              <span className="text-game-neon">JUMP:</span>
              <span>SPACE</span>
            </div>
            <div className="flex justify-center gap-4">
              <span className="text-game-neon">SPRINT:</span>
              <span>SHIFT</span>
            </div>
            <div className="flex justify-center gap-4">
              <span className="text-game-neon">WEAPONS:</span>
              <span>1/2</span>
            </div>
            <div className="flex justify-center gap-4">
              <span className="text-game-neon">RELOAD:</span>
              <span>R</span>
            </div>
            <div className="flex justify-center gap-4">
              <span className="text-game-neon">HEAL:</span>
              <span>H</span>
            </div>
            <div className="flex justify-center gap-4">
              <span className="text-game-neon">INVENTORY:</span>
              <span>I</span>
            </div>
          </div>
        )}
        <div className="mt-8 text-game-warning text-sm font-bold gaming-text animate-zone-warning">
          ⚠️ SAFE ZONE SHRINKS EVERY 45s ⚠️
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-40 select-none font-mono">
      {/* Damage flash overlay */}
      {damageFlash && (
        <div className="absolute inset-0 bg-red-500/20 animate-damage-flash pointer-events-none z-50" />
      )}
      
      {/* Hit markers */}
      {hitMarkers.map(hit => (
        <div
          key={hit.id}
          className="absolute top-1/2 left-1/2 animate-hit-marker pointer-events-none"
          style={{
            transform: `translate(calc(-50% + ${hit.x}px), calc(-50% + ${hit.y}px))`,
          }}
        >
          <div className="w-8 h-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2 bg-red-500" />
            <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-red-500" />
          </div>
        </div>
      ))}

      {/* Damage number indicator */}
      {showDamage.show && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 animate-pickup-pulse pointer-events-none">
          <div className="text-red-500 text-2xl font-bold gaming-text">
            -{showDamage.damage}
          </div>
        </div>
      )}
      {/* Health bar */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="relative">
          <div className="w-36 md:w-44 h-3 md:h-4 rounded-full overflow-hidden gaming-border">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                health <= 25 ? 'animate-critical-health' : ''
              }`}
              style={{
                width: `${Math.max(0, health)}%`,
                background: health > 50
                  ? 'linear-gradient(90deg, hsl(142 71% 45%), hsl(160 80% 50%))'
                  : health > 25
                  ? 'linear-gradient(90deg, hsl(48 96% 45%), hsl(38 96% 55%))'
                  : 'linear-gradient(90deg, hsl(0 84% 50%), hsl(0 84% 60%))',
                boxShadow: health <= 25 ? '0 0 12px hsl(0 84% 60%)' : 'none',
              }}
            />
          </div>
          {health <= 25 && (
            <div className="absolute inset-0 animate-health-warning rounded-full pointer-events-none" />
          )}
        </div>
        <div className="flex flex-col">
          <span className={`text-[10px] md:text-xs font-bold drop-shadow-lg gaming-text ${
            health <= 25 ? 'text-game-danger animate-pulse' : 'text-game-text'
          }`}>
            HP: {Math.ceil(health)}
          </span>
          <span className="text-[8px] text-game-text/40">HEALTH</span>
        </div>
      </div>

      {/* Score */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 gaming-panel px-4 py-2 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-game-neon text-xs font-bold gaming-text">SCORE</span>
          <span className="text-game-neon font-bold text-sm md:text-base drop-shadow-lg gaming-text">
            ⚡ {score.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Safe zone warning */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2">
        <div className={`gaming-panel px-3 py-1 rounded-lg ${
          safeZoneRadius < 20 ? 'animate-zone-warning' : ''
        }`}>
          <span className={`text-[10px] font-bold gaming-text ${
            safeZoneRadius < 20 ? 'text-game-danger' : 'text-game-neon/60'
          }`}>
            ZONE: {Math.round(safeZoneRadius)}m
          </span>
        </div>
      </div>

      {/* Weapon info - top right */}
      <div className="absolute top-3 right-3 text-right">
        {wepDef && activeWep && (
          <div className={`gaming-panel p-3 rounded-lg transition-all duration-300 ${
            weaponSwitchAnimation ? 'animate-weapon-switch' : ''
          } ${reloadAnimation ? 'animate-reload-shake' : ''}`}>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm gaming-text" style={{ color: wepDef.color, textShadow: `0 0 8px ${wepDef.color}40` }}>
                  {wepDef.name}
                </span>
                <div className={`w-2 h-2 rounded-full ${reloadAnimation ? 'animate-pulse' : ''}`} style={{ backgroundColor: wepDef.color }} />
              </div>
              <span className="text-game-text/80 text-xs font-mono">
                {isReloading ? (
                  <span className="text-game-warning animate-pulse font-bold">RELOADING...</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`text-game-neon font-bold ${weaponSwitchAnimation ? 'animate-pulse' : ''}`}>{activeWep.ammo}</span>
                    <span className="text-game-text/40">/ {wepDef.maxAmmo}</span>
                  </div>
                )}
              </span>
              <div className="text-[8px] text-game-text/50 font-mono">
                DMG: {wepDef.damage} • FIRERATE: {wepDef.fireRate}s
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-6 h-6 relative animate-crosshair-pulse">
          <div className="absolute top-1/2 left-0 w-full h-[1px] -translate-y-1/2" style={{ background: 'linear-gradient(90deg, transparent, hsl(195 100% 50% / 0.8), transparent)' }} />
          <div className="absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2" style={{ background: 'linear-gradient(180deg, transparent, hsl(195 100% 50% / 0.8), transparent)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-game-neon/70" />
          <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2 border-game-neon/50" />
          <div className="absolute -top-1 -right-1 w-2 h-2 border-r-2 border-t-2 border-game-neon/50" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l-2 border-b-2 border-game-neon/50" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r-2 border-b-2 border-game-neon/50" />
        </div>
      </div>

      {/* Weapon bar - bottom center */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {weapons.map((w, i) => {
          const isActive = i === activeSlot;
          const wd = w ? WEAPONS[w.weaponId] : null;
          return (
            <div 
              key={i} 
              className={`px-3 py-2 rounded-lg gaming-panel min-w-[80px] transition-all duration-200 cursor-pointer pointer-events-auto ${
                isActive
                  ? 'animate-weapon-switch'
                  : 'hover:scale-105'
              }`}
              onClick={() => !isActive && useGameStore.getState().switchWeapon(i)}
            >
              {w && wd ? (
                <>
                  <div className="text-[10px] font-bold gaming-text" style={{ color: wd.color }}>
                    {wd.name}
                  </div>
                  <div className="text-[11px] text-game-text/70 font-mono">
                    {w.ammo}/{wd.maxAmmo}
                  </div>
                  {isActive && (
                    <div className="text-[7px] text-game-neon font-bold mt-1">EQUIPPED</div>
                  )}
                </>
              ) : (
                <div className="text-[9px] text-game-text/30 gaming-text">EMPTY</div>
              )}
              <div className="text-[7px] text-game-text/30 mt-1">[{i + 1}]</div>
            </div>
          );
        })}
        {healthKits > 0 && (
          <div className="px-3 py-2 rounded-lg gaming-panel min-w-[80px] animate-pulse">
            <div className="text-[10px] text-game-health font-bold gaming-text">💊 HEALTH</div>
            <div className="text-[11px] text-game-text/70 font-mono">×{healthKits}</div>
            <div className="text-[7px] text-game-text/30 mt-1">[H]</div>
          </div>
        )}
      </div>

      {/* Pickup message */}
      {pickupMessage && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-12 animate-pickup-pulse pointer-events-none">
          <div className="gaming-panel px-4 py-2 rounded-lg">
            <span className="text-game-neon text-sm font-bold gaming-text">
              ✨ {pickupMessage} ✨
            </span>
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto animate-fade-in"
          style={{ background: 'radial-gradient(ellipse at center, rgba(20,0,0,0.95) 0%, rgba(5,5,16,0.98) 100%)' }}>
          <div className="relative">
            <h1 className="text-game-danger text-5xl md:text-7xl font-black mb-2 animate-pulse-neon gaming-text">
              GAME OVER
            </h1>
            <div className="absolute inset-0 animate-pulse-neon" style={{ filter: 'blur(30px)', opacity: 0.5 }}></div>
          </div>
          <div className="gaming-panel p-6 rounded-lg mb-8">
            <p className="text-game-neon text-2xl md:text-3xl font-bold gaming-text">FINAL SCORE</p>
            <p className="text-game-neon text-3xl md:text-4xl font-black gaming-text animate-pulse-neon">
              {score.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => { restart(); if (!isMobile) setTimeout(() => document.querySelector('canvas')?.requestPointerLock(), 100); }}
            className="gaming-button px-10 py-4 rounded-lg font-bold text-xl text-game-text gaming-text transition-all duration-200 hover:scale-105 pointer-events-auto"
          >
            🔄 RESTART 🔄
          </button>
          <div className="mt-6 text-game-text/40 text-sm gaming-text">
            You survived {Math.floor((48 - safeZoneRadius) / 6)} zones
          </div>
        </div>
      )}
    </div>
  );
};

export default HUD;
