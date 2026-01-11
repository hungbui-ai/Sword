import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 600;

export default function MagicSwords({ handData }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      t: Math.random() * 100,
      factor: 1.5 + Math.random() * 4,
      speed: 0.005 + Math.random() / 150,
      offset: Math.random() * Math.PI * 2
    }));
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (!meshRef.current) return;

    // Chuyển đổi tọa độ tay mượt mà hơn
    const targetX = handData ? (handData.x - 0.5) * -18 : 0;
    const targetY = handData ? (handData.y - 0.5) * -12 : 0;

    particles.forEach((p, i) => {
      p.t += p.speed;
      
      // Công thức xoáy quanh vị trí ngón tay
      const angle = p.t + (i / COUNT) * Math.PI * 12;
      const dist = p.factor + Math.sin(time + i * 0.1) * 0.3;
      
      const x = targetX + Math.cos(angle) * dist;
      const y = targetY + Math.sin(angle) * dist;
      const z = Math.cos(angle * 0.5 + time) * 2;

      dummy.position.set(x, y, z);
      
      // Hướng mũi kiếm vào tâm (vị trí tay)
      dummy.lookAt(targetX, targetY, 0);
      dummy.rotation.x += Math.PI / 2; // Đảm bảo thân kiếm dọc theo hướng di chuyển
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
      <cylinderGeometry args={[0.01, 0.04, 1.2, 4]} /> 
      <meshStandardMaterial 
        color="#00ffcc" 
        emissive="#00ffaa" 
        emissiveIntensity={10} 
        toneMapped={false} 
      />
    </instancedMesh>
  );
}
