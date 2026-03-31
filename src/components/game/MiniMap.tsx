import { useRef, useEffect } from 'react';
import { playerState, minimapData } from '@/lib/inputState';
import { useGameStore } from '@/stores/gameStore';
import { BUILDINGS, MAP_HALF } from '@/lib/mapData';

const MINIMAP_SIZE = 140;

const MiniMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const started = useGameStore((s) => s.started);

  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const s = MINIMAP_SIZE;
    const scale = s / (MAP_HALF * 2);

    const toX = (wx: number) => (wx + MAP_HALF) * scale;
    const toY = (wz: number) => (wz + MAP_HALF) * scale;

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, s, s);

      // Background
      ctx.fillStyle = 'rgba(5, 5, 20, 0.85)';
      ctx.fillRect(0, 0, s, s);

      // Border
      ctx.strokeStyle = 'hsl(195 100% 50% / 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, s, s);

      // Buildings
      ctx.fillStyle = 'rgba(30, 30, 60, 0.8)';
      BUILDINGS.forEach((b) => {
        const bx = toX(b.pos[0]) - (b.size[0] * scale) / 2;
        const by = toY(b.pos[2]) - (b.size[2] * scale) / 2;
        ctx.fillRect(bx, by, b.size[0] * scale, b.size[2] * scale);
      });

      // Safe zone
      const szr = useGameStore.getState().safeZoneRadius;
      ctx.strokeStyle = 'hsl(210 100% 50% / 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, szr * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Loot
      minimapData.loot.forEach((l) => {
        const lx = toX(l.x);
        const ly = toY(l.z);
        ctx.fillStyle = l.type === 'weapon' ? '#cc00ff' : l.type === 'ammo' ? '#ffcc00' : '#00ff88';
        ctx.fillRect(lx - 1.5, ly - 1.5, 3, 3);
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

  if (!started) return null;

  return (
    <div className="fixed top-14 right-3 z-40 pointer-events-none rounded-lg overflow-hidden"
      style={{ boxShadow: '0 0 15px hsl(195 100% 50% / 0.1)', border: '1px solid hsl(195 100% 50% / 0.15)' }}>
      <canvas ref={canvasRef} width={MINIMAP_SIZE} height={MINIMAP_SIZE} />
    </div>
  );
};

export default MiniMap;
