import React, { useRef, useMemo } from "react";
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
    }));
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (!meshRef.current) return;

    // Tọa độ tay từ state (0-1) chuyển sang không gian 3D
    const targetX = handData ? (handData.x - 0.5) * -18 : 0;
    const targetY = handData ? (handData.y - 0.5) * -12 : 0;

    particles.forEach((p, i) => {
      p.t += p.speed;
      
      const angle = p.t + (i / COUNT) * Math.PI * 12;
      const dist = p.factor + Math.sin(time + i * 0.1) * 0.3;
      
      const x = targetX + Math.cos(angle) * dist;
      const y = targetY + Math.sin(angle) * dist;
      const z = Math.cos(angle * 0.5 + time) * 2;

      dummy.position.set(x, y, z);
      dummy.lookAt(targetX, targetY, 0);
      dummy.rotation.x += Math.PI / 2; 
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
      <coneGeometry args={[0.05, 0.6, 3]} /> 
      <meshStandardMaterial 
        color="#00ffaa" 
        emissive="#00ffaa" 
        emissiveIntensity={5} 
        toneMapped={false} 
      />
    </instancedMesh>
  );
}