import { useGameStore } from '@/stores/gameStore';
import { WEAPONS } from '@/lib/gameTypes';

const Inventory = () => {
  const weapons = useGameStore((s) => s.weapons);
  const activeSlot = useGameStore((s) => s.activeSlot);
  const healthKits = useGameStore((s) => s.healthKits);
  const health = useGameStore((s) => s.health);
  const inventoryOpen = useGameStore((s) => s.inventoryOpen);
  const switchWeapon = useGameStore((s) => s.switchWeapon);
  const useHK = useGameStore((s) => s.useHealthKit);
  const toggle = useGameStore((s) => s.toggleInventory);

  if (!inventoryOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ pointerEvents: 'auto' }}>
      <div className="absolute inset-0 bg-game-hud/50 backdrop-blur-sm" onClick={toggle} />
      <div className="relative rounded-xl p-5 w-[300px] animate-slide-up border"
        style={{
          background: 'linear-gradient(180deg, hsl(230 40% 10% / 0.95), hsl(230 50% 6% / 0.95))',
          borderColor: 'hsl(195 100% 50% / 0.2)',
          boxShadow: '0 0 40px hsl(195 100% 50% / 0.1), inset 0 1px 0 hsl(195 100% 50% / 0.1)',
        }}>
        <h2 className="text-game-neon text-lg font-black mb-4 text-center tracking-widest">INVENTORY</h2>

        {[0, 1].map((i) => {
          const w = weapons[i];
          const isActive = i === activeSlot;
          const wd = w ? WEAPONS[w.weaponId] : null;
          return (
            <div key={i} className={`mb-2 p-3 rounded-lg border transition-all duration-200 ${
              isActive ? 'border-game-neon/40 bg-game-neon/5' : 'border-game-neon/10 bg-game-hud/20'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold" style={{ color: wd?.color || 'hsl(var(--game-text) / 0.3)' }}>
                    {wd ? wd.name : 'Empty Slot'}
                  </div>
                  {wd && w && (
                    <>
                      <div className="text-[10px] text-game-text/50 mt-0.5">
                        Ammo: {w.ammo}/{wd.maxAmmo}
                      </div>
                      <div className="text-[9px] text-game-text/30">
                        DMG: {wd.damage} • Rate: {wd.fireRate}s • Reload: {wd.reloadTime}s
                      </div>
                    </>
                  )}
                </div>
                {w && !isActive && (
                  <button
                    onClick={() => switchWeapon(i)}
                    className="px-2 py-1 text-[10px] font-bold rounded transition-all duration-200 text-game-neon border border-game-neon/30 bg-game-neon/10 hover:bg-game-neon/20"
                  >
                    EQUIP
                  </button>
                )}
                {isActive && w && (
                  <span className="text-[9px] text-game-neon font-bold px-2 py-0.5 rounded bg-game-neon/10 border border-game-neon/20">
                    ACTIVE
                  </span>
                )}
              </div>
            </div>
          );
        })}

        <div className="mt-3 p-3 rounded-lg border border-game-health/20 bg-game-hud/20">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs font-bold text-game-health">Health Kits</div>
              <div className="text-[10px] text-game-text/40">
                ×{healthKits} (+30 HP each) • HP: {Math.ceil(health)}/100
              </div>
            </div>
            {healthKits > 0 && health < 100 && (
              <button
                onClick={useHK}
                className="px-2 py-1 text-[10px] font-bold rounded transition-all duration-200 text-game-health border border-game-health/30 bg-game-health/10 hover:bg-game-health/20"
              >
                USE
              </button>
            )}
          </div>
        </div>

        <button
          onClick={toggle}
          className="mt-3 w-full py-1.5 rounded text-game-text/40 text-[10px] border border-game-text/10 bg-game-text/5 hover:bg-game-text/10 transition-all duration-200"
        >
          Close [I]
        </button>
      </div>
    </div>
  );
};

export default Inventory;
