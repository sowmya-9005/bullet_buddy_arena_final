import * as THREE from 'three';
import { BUILDINGS, COVER_WALLS, CRATES, NEON_LIGHTS, MAP_HALF } from '@/lib/mapData';

const Environment = () => (
  <>
    <ambientLight intensity={0.2} />
    <directionalLight position={[30, 40, 20]} intensity={0.8} castShadow />
    <hemisphereLight args={['#1a1a4e', '#0a1a0a', 0.3]} />
    <fog attach="fog" args={['#050510', 30, 80]} />
    <color attach="background" args={['#050510']} />

    {/* Ground */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[MAP_HALF * 2, MAP_HALF * 2]} />
      <meshStandardMaterial color="#0a1a15" roughness={0.95} />
    </mesh>
    <gridHelper args={[MAP_HALF * 2, 50, '#0a2a2a', '#0a2020']} position={[0, 0.01, 0]} />

    {/* Boundary walls */}
    {[
      [0, 3, -MAP_HALF] as const, [0, 3, MAP_HALF] as const,
      [-MAP_HALF, 3, 0] as const, [MAP_HALF, 3, 0] as const,
    ].map((pos, i) => (
      <mesh key={`bw${i}`} position={pos as any} castShadow receiveShadow>
        <boxGeometry args={[i < 2 ? MAP_HALF * 2 : 0.5, 6, i < 2 ? 0.5 : MAP_HALF * 2]} />
        <meshStandardMaterial color="#0d0d2a" roughness={0.8} />
      </mesh>
    ))}

    {/* Buildings */}
    {BUILDINGS.map((b, i) => (
      <mesh key={`bld${i}`} position={b.pos} castShadow receiveShadow>
        <boxGeometry args={b.size} />
        <meshStandardMaterial color={b.color} roughness={0.7} metalness={0.2} />
      </mesh>
    ))}

    {/* Cover walls */}
    {COVER_WALLS.map((w, i) => (
      <mesh key={`cw${i}`} position={w.pos} castShadow receiveShadow>
        <boxGeometry args={w.size} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>
    ))}

    {/* Crates */}
    {CRATES.map((c, i) => (
      <mesh key={`cr${i}`} position={c.pos} castShadow receiveShadow>
        <boxGeometry args={c.size} />
        <meshStandardMaterial color="#2a1a08" roughness={0.7} />
      </mesh>
    ))}

    {/* Neon point lights */}
    {NEON_LIGHTS.map((l, i) => (
      <pointLight key={`nl${i}`} position={l.pos} color={l.color} intensity={3} distance={18} decay={2} />
    ))}
  </>
);

export default Environment;
