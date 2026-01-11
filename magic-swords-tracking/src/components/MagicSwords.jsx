import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 630; // 21 khớp * 30 kiếm
const JOINTS = 21;

export default function MagicSwords({ handData }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempVec = useMemo(() => new THREE.Vector3(), []);
  
  // Vị trí mượt của 21 khớp tay
  const jointPositions = useMemo(() => 
    Array.from({ length: JOINTS }, () => new THREE.Vector3()), []
  );

  // Khởi tạo các thanh kiếm
  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, (_, i) => ({
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      jointIdx: i % JOINTS,
      // OFFSET HÌNH CẦU: Phân bổ đều quanh khớp
      offset: new THREE.Vector3().setFromSphericalCoords(
        Math.random() * 2 + 0.5, // Bán kính quả cầu
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2
      ),
      phase: Math.random() * Math.PI * 2
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    // 1. Cập nhật vị trí tay
    if (handData) {
      handData.forEach((pt, i) => {
        // Tọa độ chuẩn không bị ngược
        const x = (pt.x - 0.5) * -22; 
        const y = (pt.y - 0.5) * -16;
        const z = pt.z * -15;
        jointPositions[i].lerp(tempVec.set(x, y, z), 0.3);
      });
    }

    // 2. Cập nhật từng thanh kiếm
    particles.forEach((p, i) => {
      const joint = jointPositions[p.jointIdx];
      const target = tempVec.copy(joint).add(p.offset);

      if (!handData) {
        // Nếu không có tay, bay lượn tự do
        target.set(Math.sin(time + p.phase) * 6, Math.cos(time + p.phase) * 6, 0);
      } else {
        // Thêm độ rung lắc năng lượng
        target.x += Math.sin(time * 8 + p.phase) * 0.15;
        target.y += Math.cos(time * 8 + p.phase) * 0.15;
      }

      // LỰC HÚT MẠNH (Magnetic attraction)
      const force = new THREE.Vector3().subVectors(target, p.pos);
      p.vel.add(force.multiplyScalar(0.18)); // Lực kéo cực mạnh
      p.vel.multiplyScalar(0.8); // Ma sát để không bay quá xa
      p.pos.add(p.vel);

      // CẬP NHẬT DUMMY
      dummy.position.copy(p.pos);
      
      // Hướng kiếm: Chĩa từ tâm khớp tay ra ngoài (tạo hình cầu lởm chởm)
      const lookTarget = p.pos.clone().add(p.vel).add(p.pos.clone().sub(joint).normalize());
      dummy.lookAt(lookTarget);
      dummy.rotation.x += Math.PI / 2;

      // Kéo dãn theo tốc độ (Trail effect)
      const s = 1 + p.vel.length() * 2.5;
      dummy.scale.set(0.7, s, 0.7);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
      <coneGeometry args={[0.015, 1.2, 4]} />
      <meshStandardMaterial 
        color="#00ffff" 
        emissive="#00ffff" 
        emissiveIntensity={3} 
        toneMapped={false} 
      />
    </instancedMesh>
  );
}