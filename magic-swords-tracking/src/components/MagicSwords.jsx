import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 800;

export default function MagicSwords({ handData }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Khởi tạo vị trí ngẫu nhiên ban đầu
  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      t: Math.random() * 100,
      factor: 2 + Math.random() * 5,
      speed: 0.01 + Math.random() / 100,
    }));
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Tọa độ tay (target)
    const targetX = handData ? (handData.x - 0.5) * -15 : 0;
    const targetY = handData ? (handData.y - 0.5) * -10 : 0;

    particles.forEach((p, i) => {
      p.t += p.speed;
      
      // Công thức toán học tạo hình xoắn ốc (Spiral)
      const angle = p.t + (i / COUNT) * Math.PI * 20;
      const radius = p.factor + Math.sin(time * 0.5) * 2;
      
      const x = targetX + Math.cos(angle) * radius;
      const y = targetY + Math.sin(angle) * radius;
      const z = Math.sin(angle + time) * 2;

      dummy.position.set(x, y, z);
      
      // Để thanh kiếm hướng về phía tay (giống video)
      dummy.lookAt(targetX, targetY, 0);
      dummy.rotation.z += Math.PI / 2; // Điều chỉnh trục kiếm
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
      {/* Hình dáng thanh kiếm (dẹt và nhọn) */}
      <boxGeometry args={[0.02, 0.8, 0.02]} /> 
      <meshStandardMaterial 
        color="#40ffaa" 
        emissive="#00ff88" 
        emissiveIntensity={4} 
        toneMapped={false} 
      />
    </instancedMesh>
  );
}
