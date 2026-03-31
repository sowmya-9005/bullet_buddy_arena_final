import { useRef, useState, useEffect } from 'react';
import { inputState } from '@/lib/inputState';
import { useGameStore } from '@/stores/gameStore';

const MobileControls = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [thumbPos, setThumbPos] = useState({ x: 0, y: 0 });
  const started = useGameStore((s) => s.started);

  const joystickRef = useRef<HTMLDivElement>(null);
  const joyTouchId = useRef<number | null>(null);
  const joyCenter = useRef({ x: 0, y: 0 });
  const lookTouchId = useRef<number | null>(null);
  const lookLast = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  if (!isMobile || !started) return null;

  const onJoyStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const t = e.changedTouches[0];
    joyTouchId.current = t.identifier;
    const rect = joystickRef.current!.getBoundingClientRect();
    joyCenter.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };
  const onJoyMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === joyTouchId.current) {
        const dx = t.clientX - joyCenter.current.x;
        const dy = t.clientY - joyCenter.current.y;
        const maxR = 40;
        const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxR);
        const angle = Math.atan2(dy, dx);
        const cx = Math.cos(angle) * dist;
        const cy = Math.sin(angle) * dist;
        setThumbPos({ x: cx, y: cy });
        inputState.moveX = cx / maxR;
        inputState.moveZ = -cy / maxR;
      }
    }
  };
  const onJoyEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyTouchId.current) {
        joyTouchId.current = null;
        setThumbPos({ x: 0, y: 0 });
        inputState.moveX = 0;
        inputState.moveZ = 0;
      }
    }
  };

  const onLookStart = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    lookTouchId.current = t.identifier;
    lookLast.current = { x: t.clientX, y: t.clientY };
  };
  const onLookMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === lookTouchId.current) {
        inputState.lookDeltaX += t.clientX - lookLast.current.x;
        inputState.lookDeltaY += t.clientY - lookLast.current.y;
        lookLast.current = { x: t.clientX, y: t.clientY };
      }
    }
  };
  const onLookEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) lookTouchId.current = null;
    }
  };

  const btnBase = "rounded-full font-black text-game-text select-none touch-none active:scale-90 transition-transform duration-100 flex items-center justify-center backdrop-blur-sm";

  return (
    <>
      {/* Look area */}
      <div className="fixed top-0 right-0 w-3/5 h-full z-[45] touch-none" style={{ pointerEvents: 'auto' }}
        onTouchStart={onLookStart} onTouchMove={onLookMove} onTouchEnd={onLookEnd} />

      {/* Joystick */}
      <div ref={joystickRef}
        className="fixed bottom-8 left-6 w-[110px] h-[110px] rounded-full z-50 touch-none"
        style={{ pointerEvents: 'auto', border: '2px solid hsl(195 100% 50% / 0.2)', background: 'hsl(230 40% 10% / 0.3)' }}
        onTouchStart={onJoyStart} onTouchMove={onJoyMove} onTouchEnd={onJoyEnd}>
        <div className="absolute w-11 h-11 rounded-full"
          style={{
            left: `calc(50% - 22px + ${thumbPos.x}px)`,
            top: `calc(50% - 22px + ${thumbPos.y}px)`,
            background: 'hsl(195 100% 50% / 0.25)',
            border: '1px solid hsl(195 100% 50% / 0.4)',
          }} />
      </div>

      {/* Action buttons */}
      <div className="fixed bottom-6 right-4 flex flex-col items-end gap-2 z-50" style={{ pointerEvents: 'auto' }}>
        {/* Fire */}
        <button className={`${btnBase} w-[72px] h-[72px] text-[11px]`}
          style={{ background: 'hsl(0 84% 60% / 0.3)', border: '2px solid hsl(0 84% 60% / 0.4)', boxShadow: '0 0 12px hsl(0 84% 60% / 0.15)' }}
          onTouchStart={(e) => { e.stopPropagation(); inputState.isFiring = true; }}
          onTouchEnd={(e) => { e.stopPropagation(); inputState.isFiring = false; }}>
          FIRE
        </button>

        <div className="flex gap-2">
          <button className={`${btnBase} w-12 h-12 text-[8px]`}
            style={{ background: 'hsl(195 100% 50% / 0.15)', border: '1px solid hsl(195 100% 50% / 0.25)' }}
            onTouchStart={(e) => { e.stopPropagation(); inputState.jumpPressed = true; }}>
            JUMP
          </button>
          <button className={`${btnBase} w-12 h-12 text-[8px]`}
            style={{ background: 'hsl(195 100% 50% / 0.15)', border: '1px solid hsl(195 100% 50% / 0.25)' }}
            onTouchStart={(e) => { e.stopPropagation(); inputState.crouching = true; }}
            onTouchEnd={(e) => { e.stopPropagation(); inputState.crouching = false; }}>
            DUCK
          </button>
          <button className={`${btnBase} w-12 h-12 text-[8px]`}
            style={{ background: 'hsl(270 100% 65% / 0.15)', border: '1px solid hsl(270 100% 65% / 0.25)' }}
            onTouchStart={(e) => { e.stopPropagation(); inputState.reloadPressed = true; }}>
            RLD
          </button>
        </div>
      </div>

      {/* Top-right utility buttons */}
      <div className="fixed top-[170px] right-3 flex flex-col gap-2 z-50" style={{ pointerEvents: 'auto' }}>
        <button className={`${btnBase} w-10 h-10 text-[7px]`}
          style={{ background: 'hsl(195 100% 50% / 0.1)', border: '1px solid hsl(195 100% 50% / 0.2)' }}
          onTouchStart={(e) => { e.stopPropagation(); inputState.toggleInventory = true; }}>
          INV
        </button>
        <button className={`${btnBase} w-10 h-10 text-[7px]`}
          style={{ background: 'hsl(142 71% 45% / 0.15)', border: '1px solid hsl(142 71% 45% / 0.25)' }}
          onTouchStart={(e) => { e.stopPropagation(); inputState.useHealthKit = true; }}>
          HEAL
        </button>
        <button className={`${btnBase} w-10 h-10 text-[7px]`}
          style={{ background: 'hsl(270 100% 65% / 0.1)', border: '1px solid hsl(270 100% 65% / 0.2)' }}
          onTouchStart={(e) => {
            e.stopPropagation();
            const store = useGameStore.getState();
            const nextSlot = store.activeSlot === 0 ? 1 : 0;
            inputState.switchWeapon = nextSlot;
          }}>
          SWAP
        </button>
      </div>
    </>
  );
};

export default MobileControls;
