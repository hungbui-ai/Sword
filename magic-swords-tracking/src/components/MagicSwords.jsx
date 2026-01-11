import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 800; // Số lượng lớn để tạo cảm giác dày đặc
const JOINTS = 21;

export default function MagicSwords({ handData }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Khởi tạo trạng thái vật lý cho từng thanh kiếm
  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      position: new THREE.Vector3(Math.random()*20-10, Math.random()*20-10, 0),
      velocity: new THREE.Vector3(),
      jointIdx: Math.floor(Math.random() * JOINTS),
      offset: new THREE.Vector3((Math.random()-0.5)*10, (Math.random()-0.5)*10, (Math.random()-0.5)*10),
      mass: 0.8 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  const jointPositions = useMemo(() => Array.from({ length: JOINTS }, () => new THREE.Vector3()), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    // 1. LOGIC: NHẬN DIỆN CỬ CHỈ NẮM/XÒE
    let openness = 1.0;
    if (handData) {
      // Khoảng cách giữa cổ tay (0) và đầu ngón giữa (12)
      const d = new THREE.Vector3(handData[0].x, handData[0].y, 0)
                .distanceTo(new THREE.Vector3(handData[12].x, handData[12].y, 0));
      openness = THREE.MathUtils.mapLinear(d, 0.1, 0.4, 0.1, 1.5); // Nắm lại d thấp -> openness thấp

      handData.forEach((pt, i) => {
        jointPositions[i].set((pt.x - 0.5) * 25, (pt.y - 0.5) * -18, pt.z * -15);
      });
    }

    particles.forEach((p, i) => {
      const joint = jointPositions[p.jointIdx];
      const target = new THREE.Vector3();

      if (handData) {
        // 2. LOGIC: DYNAMIC SPREAD (Xòe ra hoặc tụ lại)
        // Khi nắm tay (openness nhỏ), offset sẽ bị triệt tiêu khiến kiếm tụ lại
        const spread = p.offset.clone().multiplyScalar(openness);
        target.copy(joint).add(spread);
        
        // 3. LOGIC: BROWNIAN MOTION (Chuyển động tự do quanh khớp)
        target.x += Math.sin(time * 2 + p.phase) * openness * 2;
        target.y += Math.cos(time * 2 + p.phase) * openness * 2;
      } else {
        // IDLE: Bay lơ lửng khi không có tay
        target.set(Math.sin(time*0.5 + p.phase)*12, Math.cos(time*0.4 + p.phase)*10, Math.sin(time)*5);
      }

      // 4. LOGIC: PHYSICS & INERTIA (Quán tính mạnh)
      const force = new THREE.Vector3().subVectors(target, p.position);
      const dist = force.length();
      
      // Lực hút tỉ lệ thuận với khoảng cách (Lò xo)
      force.normalize().multiplyScalar(dist * 0.04);
      
      p.velocity.add(force.divideScalar(p.mass));
      // Damping (Ma sát không khí) - Số càng nhỏ quán tính càng lớn
      p.velocity.multiplyScalar(0.94); 
      p.position.add(p.velocity);

      // 5. LOGIC: LOOK AT & STRETCH (Xoay và Kéo dãn theo vận tốc)
      dummy.position.copy(p.position);
      const velocityDir = p.position.clone().add(p.velocity);
      dummy.lookAt(velocityDir);
      dummy.rotation.x += Math.PI / 2;

      // Kéo dài kiếm dựa trên tốc độ bay
      const speed = p.velocity.length();
      const stretch = 1 + speed * 3;
      // Nếu nắm tay, kiếm thu ngắn lại thành các điểm sáng
      dummy.scale.set(openness * 0.5 + 0.5, stretch * (openness * 0.5 + 0.5), openness * 0.5 + 0.5);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
      <cylinderGeometry args={[0.01, 0.03, 1.2, 3]} />
      <meshStandardMaterial 
        color="#00fff2" 
        emissive="#00fff2" 
        emissiveIntensity={15} 
        toneMapped={false} 
      />
    </instancedMesh>
  );
}