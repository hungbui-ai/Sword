import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const JOINT_COUNT = 21;
const PER_JOINT = 15; 
const TOTAL_COUNT = JOINT_COUNT * PER_JOINT;

export default function MagicSwords({ handLandmarks }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Lưu vị trí mượt của 21 khớp
  const smoothedJoints = useMemo(() => 
    Array.from({ length: JOINT_COUNT }, () => new THREE.Vector3()), []
  );

  const swords = useMemo(() => {
    return Array.from({ length: TOTAL_COUNT }, (_, i) => ({
      jointIdx: i % JOINT_COUNT,
      // TĂNG ĐỘ LAN TỎA (Spread): Kiếm sẽ bay rộng quanh khớp
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6
      ),
      speed: 0.01 + Math.random() * 0.03,
      phase: Math.random() * Math.PI * 2
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    if (handLandmarks) {
      handLandmarks.forEach((pt, i) => {
        // FIX HƯỚNG DI CHUYỂN: Dùng (pt.x - 0.5) * 22 để khớp với SelfieMode
        const x = (pt.x - 0.5) * 22; 
        const y = (pt.y - 0.5) * -16;
        const z = pt.z * -15;
        smoothedJoints[i].lerp(new THREE.Vector3(x, y, z), 0.12);
      });
    }

    swords.forEach((s, i) => {
      const joint = smoothedJoints[s.jointIdx];
      
      // Hiệu ứng Noise để kiếm không bị đứng im một cục
      const noise = Math.sin(time * 1.5 + s.phase) * 0.8;
      
      const targetPos = new THREE.Vector3(
        joint.x + s.offset.x + noise,
        joint.y + s.offset.y + noise,
        joint.z + s.offset.z + noise
      );

      // Nếu không có tay, cho kiếm bay tự do toàn màn hình
      if (!handLandmarks) {
        targetPos.set(
          Math.sin(time * 0.3 + s.phase) * 10,
          Math.cos(time * 0.3 + s.phase) * 8,
          Math.sin(time * 0.5) * 5
        );
      }

      // Tăng độ trễ để tạo vệt (Ghostly trail)
      dummy.position.lerp(targetPos, 0.07); 
      
      // Hướng kiếm: Luôn nhìn về phía khớp tay tương ứng
      dummy.lookAt(joint.x, joint.y, joint.z);
      dummy.rotation.x += Math.PI / 2;

      // Scale nhẹ theo nhịp thở của noise
      const sScale = 0.8 + Math.sin(time * 2 + s.phase) * 0.2;
      dummy.scale.set(sScale, sScale, sScale);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, TOTAL_COUNT]}>
      {/* BoxGeometry siêu mảnh để nhìn giống tia sáng hơn */}
      <boxGeometry args={[0.015, 1.2, 0.015]} /> 
      <meshStandardMaterial 
        color="#00fff2" 
        emissive="#00fff2" 
        emissiveIntensity={15} 
        toneMapped={false} 
      />
    </instancedMesh>
  );
}