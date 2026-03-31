import { useGameStore } from '@/stores/gameStore';
import { WEAPONS } from '@/lib/gameTypes';
import { useEffect, useState, useRef } from 'react';
import { playerState, minimapData } from '@/lib/inputState';
import { BUILDINGS, MAP_HALF } from '@/lib/mapData';

interface KillFeedItem {
  id: number;
  message: string;
  timestamp: number;
  type: 'kill' | 'pickup' | 'zone';
}

const BRHUD = () => {
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
  
  const [killFeed, setKillFeed] = useState<KillFeedItem[]>([]);
  const [damageFlash, setDamageFlash] = useState(false);
  const [damageDirection, setDamageDirection] = useState<'left' | 'right' | 'front' | 'back' | null>(null);
  const [compass, setCompass] = useState(0);
  const [kills, setKills] = useState(0);
  const [timeAlive, setTimeAlive] = useState(0);
  
  const prevHealthRef = useRef(health);
  const prevSlotRef = useRef(activeSlot);
  const startTimeRef = useRef(Date.now());
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);

  // Update compass based on player rotation (simplified)
  useEffect(() => {
    const interval = setInterval(() => {
      setCompass(prev => (prev + 1) % 360);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Reset game state when starting/restarting
  useEffect(() => {
    if (started && !gameOver) {
      setKills(0);
      setTimeAlive(0);
      setKillFeed([]);
      startTimeRef.current = Date.now();
    }
  }, [started, gameOver]);

  // Update time alive
  useEffect(() => {
    if (started && !gameOver) {
      const interval = setInterval(() => {
        setTimeAlive(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [started, gameOver]);

  // Minimap drawing
  useEffect(() => {
    if (!started) return;
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const s = 128; // Minimap size
    const scale = s / (MAP_HALF * 2);

    const toX = (wx: number) => (wx + MAP_HALF) * scale;
    const toY = (wz: number) => (wz + MAP_HALF) * scale;

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, s, s);

      // Background
      ctx.fillStyle = 'rgba(10, 20, 40, 0.9)';
      ctx.fillRect(0, 0, s, s);

      // Buildings
      ctx.fillStyle = 'rgba(30, 30, 60, 0.8)';
      BUILDINGS.forEach((b) => {
        const bx = toX(b.pos[0]) - (b.size[0] * scale) / 2;
        const by = toY(b.pos[2]) - (b.size[2] * scale) / 2;
        ctx.fillRect(bx, by, b.size[0] * scale, b.size[2] * scale);
      });

      // Safe zone
      const szr = useGameStore.getState().safeZoneRadius;
      ctx.strokeStyle = 'rgba(255, 217, 61, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, szr * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Loot
      minimapData.loot.forEach((l) => {
        const lx = toX(l.x);
        const ly = toY(l.z);
        ctx.fillStyle = l.type === 'weapon' ? '#cc00ff' : l.type === 'ammo' ? '#ffcc00' : '#00ff88';
        ctx.fillRect(lx - 2, ly - 2, 4, 4);
      });

      // Enemies
      ctx.fillStyle = '#ff3333';
      minimapData.enemies.forEach((e) => {
        ctx.fillRect(toX(e.x) - 2, toY(e.z) - 2, 4, 4);
      });

      // Player
      const px = toX(playerState.x);
      const py = toY(playerState.z);
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();

      // Player direction
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + playerState.forwardX * 8, py + playerState.forwardZ * 8);
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [started]);

  // Damage flash effect
  useEffect(() => {
    if (health < prevHealthRef.current && health > 0) {
      setDamageFlash(true);
      const damage = Math.ceil(prevHealthRef.current - health);
      
      // Calculate damage direction (simplified - would need enemy positions in real implementation)
      const directions: Array<'left' | 'right' | 'front' | 'back'> = ['left', 'right', 'front', 'back'];
      const randomDirection = directions[Math.floor(Math.random() * directions.length)];
      setDamageDirection(randomDirection);
      
      setKillFeed(prev => [{
        id: Date.now(),
        message: `-${damage} HP from ${randomDirection.toUpperCase()}`,
        timestamp: Date.now(),
        type: 'kill'
      }, ...prev.slice(0, 4)]);
      
      setTimeout(() => {
        setDamageFlash(false);
        setDamageDirection(null);
      }, 800);
    }
    prevHealthRef.current = health;
  }, [health]);

  // Handle pickup messages
  useEffect(() => {
    if (pickupMessage) {
      setKillFeed(prev => [{
        id: Date.now(),
        message: pickupMessage,
        timestamp: Date.now(),
        type: 'pickup'
      }, ...prev.slice(0, 4)]);
    }
  }, [pickupMessage]);

  // Zone warnings
  useEffect(() => {
    if (safeZoneRadius < 20) {
      setKillFeed(prev => [{
        id: Date.now(),
        message: `⚠️ ZONE CLOSING: ${Math.round(safeZoneRadius)}m`,
        timestamp: Date.now(),
        type: 'zone'
      }, ...prev.slice(0, 4)]);
    }
  }, [safeZoneRadius]);

  // Listen for enemy kills
  useEffect(() => {
    const handleEnemyKill = (event: CustomEvent) => {
      setKills(prev => prev + 1);
      setKillFeed(prev => [{
        id: Date.now(),
        message: `🎯 ENEMY ELIMINATED (+100)`,
        timestamp: Date.now(),
        type: 'kill'
      }, ...prev.slice(0, 4)]);
    };

    window.addEventListener('enemyKill', handleEnemyKill as EventListener);
    return () => window.removeEventListener('enemyKill', handleEnemyKill as EventListener);
  }, []);

  const isMobile = 'ontouchstart' in window;
  const activeWep = weapons[activeSlot];
  const wepDef = activeWep ? WEAPONS[activeWep.weaponId] : null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!started) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ 
          background: 'radial-gradient(ellipse at center, rgba(10,20,40,0.98) 0%, rgba(5,10,25,0.99) 100%)'
        }}>
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-2 tracking-wider animate-pulse">
              BULLET BUDDY
            </h1>
            <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 tracking-widest">
              ARENA
            </h2>
          </div>
          
          <div className="br-panel p-8 rounded-lg max-w-md mx-auto mb-8">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
              <div className="text-left">
                <div className="br-text-primary font-bold mb-2">CONTROLS</div>
                <div className="space-y-1 text-xs">
                  <div><span className="text-gray-400">MOVE:</span> <span className="text-white">WASD</span></div>
                  <div><span className="text-gray-400">AIM:</span> <span className="text-white">MOUSE</span></div>
                  <div><span className="text-gray-400">SHOOT:</span> <span className="text-white">CLICK</span></div>
                  <div><span className="text-gray-400">JUMP:</span> <span className="text-white">SPACE</span></div>
                  <div><span className="text-gray-400">SPRINT:</span> <span className="text-white">SHIFT</span></div>
                </div>
              </div>
              <div className="text-left">
                <div className="br-text-warning font-bold mb-2">COMBAT</div>
                <div className="space-y-1 text-xs">
                  <div><span className="text-gray-400">WEAPONS:</span> <span className="text-white">1/2</span></div>
                  <div><span className="text-gray-400">RELOAD:</span> <span className="text-white">R</span></div>
                  <div><span className="text-gray-400">HEAL:</span> <span className="text-white">H</span></div>
                  <div><span className="text-gray-400">INVENTORY:</span> <span className="text-white">I</span></div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => { 
              start(); 
              startTimeRef.current = Date.now();
              if (!isMobile) document.querySelector('canvas')?.requestPointerLock(); 
            }}
            className="br-panel px-12 py-4 rounded-lg text-xl font-black text-white hover:scale-105 transition-all duration-300 border-2 border-blue-500/50"
            style={{
              boxShadow: '0 0 30px rgba(100, 200, 255, 0.3), inset 0 0 20px rgba(100, 200, 255, 0.1)'
            }}
          >
            <span className="br-text-primary font-bold text-2xl">DEPLOY TO BATTLE</span>
          </button>

          <div className="mt-6 text-gray-500 text-sm">
            <div className="br-text-warning animate-pulse">⚠️ SAFE ZONE SHRINKS EVERY 45s ⚠️</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-40 font-sans">
      {/* Damage Flash */}
      {damageFlash && (
        <div className="absolute inset-0 bg-red-500/30 damage-flash pointer-events-none z-50" />
      )}

      {/* Damage Direction Indicators */}
      {damageDirection && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-45">
          {/* Left indicator */}
          {damageDirection === 'left' && (
            <div className="absolute -left-20 top-0 w-16 h-16 flex items-center justify-center damage-indicator-left">
              <div className="text-red-500 text-4xl font-black animate-pulse">← LEFT</div>
            </div>
          )}
          
          {/* Right indicator */}
          {damageDirection === 'right' && (
            <div className="absolute -right-20 top-0 w-16 h-16 flex items-center justify-center damage-indicator-right">
              <div className="text-red-500 text-4xl font-black animate-pulse">RIGHT →</div>
            </div>
          )}
          
          {/* Front indicator */}
          {damageDirection === 'front' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-20 w-16 h-16 flex items-center justify-center damage-indicator-front">
              <div className="text-red-500 text-4xl font-black animate-pulse">↑ FRONT</div>
            </div>
          )}
          
          {/* Back indicator */}
          {damageDirection === 'back' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-20 w-16 h-16 flex items-center justify-center damage-indicator-back">
              <div className="text-red-500 text-4xl font-black animate-pulse">↓ BACK</div>
            </div>
          )}
        </div>
      )}

      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
        <div className="relative w-8 h-8">
          {/* Main crosshair lines */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2 bg-cyan-400 opacity-80" />
          <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-cyan-400 opacity-80" />
          <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-cyan-400 rounded-full opacity-60" />
          
          {/* Corner brackets */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-cyan-400 opacity-70" />
          <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-cyan-400 opacity-70" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-cyan-400 opacity-70" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-cyan-400 opacity-70" />
        </div>
      </div>

      {/* Top Left - Health & Shield */}
      <div className="absolute top-4 left-4 space-y-2">
        <div className="br-panel p-3 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="text-xs text-gray-400 mb-1">HEALTH</div>
              <div className="w-32 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full br-health-bar transition-all duration-300 ${
                    health <= 25 ? 'animate-pulse' : ''
                  }`}
                  style={{ width: `${Math.max(0, health)}%` }}
                />
              </div>
              <div className="text-xs br-text-danger font-bold mt-1">{Math.ceil(health)} HP</div>
            </div>
            
            <div className="w-px h-8 bg-gray-600" />
            
            <div className="flex flex-col">
              <div className="text-xs text-gray-400 mb-1">SHIELD</div>
              <div className="w-24 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full br-shield-bar transition-all duration-300"
                  style={{ width: '0%' }}
                />
              </div>
              <div className="text-xs br-text-primary font-bold mt-1">0 SP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Center - Score & Timer */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2">
        <div className="br-panel p-3 rounded-lg">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-gray-400">SCORE</div>
              <div className="text-2xl font-black br-text-primary">{score.toLocaleString()}</div>
            </div>
            <div className="w-px h-8 bg-gray-600" />
            <div className="text-center">
              <div className="text-xs text-gray-400">TIME</div>
              <div className="text-2xl font-black text-white">{formatTime(timeAlive)}</div>
            </div>
            <div className="w-px h-8 bg-gray-600" />
            <div className="text-center">
              <div className="text-xs text-gray-400">KILLS</div>
              <div className="text-2xl font-black br-text-danger">{kills}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Right - Kills */}
      <div className="absolute top-4 right-4 w-80">
        <div className="space-y-2">
          {killFeed.slice(0, 5).map((item) => (
            <div 
              key={item.id}
              className={`br-kill-feed p-2 rounded text-sm kill-feed-item ${
                item.type === 'kill' ? 'br-text-danger' :
                item.type === 'pickup' ? 'br-text-success' :
                'br-text-warning'
              }`}
            >
              {item.message}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Left - Weapon Display */}
      <div className="absolute bottom-4 left-4">
        <div className="br-weapon-display p-4 rounded-lg">
          {wepDef && activeWep ? (
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">WEAPON</div>
                <div className="text-xl font-black" style={{ color: wepDef.color }}>
                  {wepDef.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  DMG: {wepDef.damage} • RATE: {wepDef.fireRate}s
                </div>
              </div>
              
              <div className="w-px h-12 bg-gray-600" />
              
              <div>
                <div className="text-xs text-gray-400 mb-1">AMMO</div>
                <div className={`text-3xl font-black ${
                  activeWep.ammo <= wepDef.maxAmmo * 0.3 ? 'ammo-low' : ''
                }`} style={{ color: wepDef.color }}>
                  {isReloading ? 'RELOAD' : activeWep.ammo}
                </div>
                <div className="text-xs text-gray-500">
                  / {wepDef.maxAmmo}
                </div>
              </div>
              
              {healthKits > 0 && (
                <>
                  <div className="w-px h-12 bg-gray-600" />
                  <div>
                    <div className="text-xs text-gray-400 mb-1">MEDKIT</div>
                    <div className="text-2xl font-black br-text-success">×{healthKits}</div>
                    <div className="text-xs text-gray-500">[H]</div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-gray-500">
              <div className="text-xs text-gray-400 mb-1">WEAPON</div>
              <div className="text-xl font-black">NO WEAPON</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Right - Minimap & Compass */}
      <div className="absolute bottom-4 right-4 space-y-3">
        {/* Compass */}
        <div className="br-compass p-3 rounded-lg w-20 h-20 flex items-center justify-center">
          <div className="relative">
            <div className="text-xs text-gray-400 absolute -top-6 left-1/2 -translate-x-1/2">N</div>
            <div className="w-16 h-16 rounded-full border-2 border-gray-600 relative">
              <div 
                className="absolute top-1/2 left-1/2 w-0.5 h-6 bg-red-500 -translate-x-1/2 -translate-y-1/2 origin-bottom"
                style={{ transform: `translate(-50%, -50%) rotate(${compass}deg)` }}
              />
            </div>
          </div>
        </div>

        {/* Minimap */}
        <div className="br-minimap p-2 rounded-lg">
          <canvas 
            ref={minimapCanvasRef}
            width={128}
            height={128}
            className="rounded border border-gray-700"
          />
        </div>
      </div>

      {/* Game Over */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto"
          style={{ background: 'radial-gradient(ellipse at center, rgba(139,0,0,0.95) 0%, rgba(0,0,0,0.98) 100%)' }}>
          <div className="br-panel p-8 rounded-lg max-w-md text-center">
            <h1 className="text-5xl font-black br-text-danger mb-4">GAME OVER</h1>
            <div className="space-y-3 mb-6">
              <div>
                <div className="text-sm text-gray-400">FINAL SCORE</div>
                <div className="text-3xl font-black br-text-primary">{score.toLocaleString()}</div>
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="text-3xl font-black br-text-danger">⚔</div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">ENEMIES ELIMINATED</div>
                  <div className="text-4xl font-black br-text-danger">{kills}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">SURVIVAL TIME</div>
                <div className="text-2xl font-black text-white">{formatTime(timeAlive)}</div>
              </div>
            </div>
            <button
              onClick={() => { 
                restart(); 
                setKills(0);
                setTimeAlive(0);
                startTimeRef.current = Date.now();
                if (!isMobile) setTimeout(() => document.querySelector('canvas')?.requestPointerLock(), 100); 
              }}
              className="w-full br-panel p-4 rounded-lg text-xl font-black br-text-primary hover:scale-105 transition-all duration-300 border-2 border-blue-500/50"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BRHUD;
