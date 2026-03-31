import { Canvas } from '@react-three/fiber';
import GameWorld from '@/components/game/GameWorld';
import BRHUD from '@/components/game/BRHUD';
import MobileControls from '@/components/game/MobileControls';
import Inventory from '@/components/game/Inventory';
import MiniMap from '@/components/game/MiniMap';

const Index = () => (
  <div className="w-screen h-screen overflow-hidden" style={{ background: '#050510' }}>
    <Canvas camera={{ fov: 75, near: 0.1, far: 150 }}>
      <GameWorld />
    </Canvas>
    <BRHUD />
    <Inventory />
    <MobileControls />
  </div>
);

export default Index;
