import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const JOINT_COUNT = 21;
const PER_JOINT = 20; // Số kiếm trên mỗi khớp
const TOTAL_COUNT = JOINT_COUNT * PER_JOINT;

export default function MagicSwords({ handLandmarks }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Mảng lưu vị trí mượt của 21 khớp
  const smoothedJoints = useMemo(() => 
    Array.from({ length: JOINT_COUNT }, () => new THREE.Vector3()), []
  );

  // Khởi tạo các thanh kiếm với "tâm hồn" riêng
  const swords = useMemo(() => {
    return Array.from({ length: TOTAL_COUNT }, (_, i) => ({
      jointIdx: i % JOINT_COUNT, // Bám theo khớp nào
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ),
      speed: 0.02 + Math.random() * 0.05,
      phase: Math.random() * Math.PI * 2
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    // 1. Tính toán độ mở bàn tay (Gesture)
    let openness = 1.0;
    if (handLandmarks) {
      // Khoảng cách từ cổ tay (0) đến đầu ngón giữa (12)
      const dx = handLandmarks[12].x - handLandmarks[0].x;
      const dy = handLandmarks[12].y - handLandmarks[0].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      openness = THREE.MathUtils.clamp(dist * 2.5, 0.2, 1.5);

      // Cập nhật vị trí 21 khớp
      handLandmarks.forEach((pt, i) => {
        const x = (pt.x - 0.5) * -22;
        const y = (pt.y - 0.5) * -16;
        const z = pt.z * -15;
        smoothedJoints[i].lerp(new THREE.Vector3(x, y, z), 0.2);
      });
    }

    // 2. Di chuyển từng thanh kiếm
    swords.forEach((s, i) => {
      const joint = smoothedJoints[s.jointIdx];
      
      // Hiệu ứng lơ lửng quanh khớp
      const orbitX = Math.sin(time * 2 + s.phase) * s.offset.x * openness;
      const orbitY = Math.cos(time * 2 + s.phase) * s.offset.y * openness;
      const orbitZ = Math.sin(time * 3 + s.phase) * s.offset.z * openness;

      const targetPos = new THREE.Vector3(
        joint.x + orbitX,
        joint.y + orbitY,
        joint.z + orbitZ
      );

      // Nếu không có tay, kiếm sẽ tự động bay về tâm và xoay nhẹ
      if (!handLandmarks) {
        targetPos.set(
          Math.sin(time + s.phase) * 5,
          Math.cos(time + s.phase) * 5,
          Math.sin(time * 0.5) * 2
        );
      }

      dummy.position.lerp(targetPos, 0.1); // Tạo độ trễ vật lý (Lag nghệ thuật)
      
      // Hướng kiếm luôn hướng về phía camera hoặc ra ngoài
      dummy.lookAt(dummy.position.x, dummy.position.y, 10);
      dummy.rotation.x += Math.PI / 2;

      // Xòe tay thì kiếm to ra, nắm tay thì kiếm thu nhỏ/mảnh lại
      const scale = 0.5 + openness * 0.5;
      dummy.scale.set(scale, scale, scale);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, TOTAL_COUNT]}>
      <cylinderGeometry args={[0.01, 0.03, 1.2, 4]} />
      <meshStandardMaterial 
        color="#00ffcc" 
        emissive="#00ffaa" 
        emissiveIntensity={8} 
        toneMapped={false} 
      />
    </instancedMesh>
  );
}